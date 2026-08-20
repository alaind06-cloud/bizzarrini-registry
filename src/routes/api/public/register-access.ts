import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { clientIp, rateLimit } from "@/lib/rate-limit.server";

const MARQUE = "bizzarrini";

const ALLOWED_ORIGINS = new Set([
  "https://www.registerbizzarrini.com",
  "https://registerbizzarrini.com",
  "https://bizzarrini-registry.lovable.app",
  "https://id-preview--fc4836e6-1d01-4b29-8f2c-017e1286da53.lovable.app",
  "https://project--fc4836e6-1d01-4b29-8f2c-017e1286da53.lovable.app",
  "https://project--fc4836e6-1d01-4b29-8f2c-017e1286da53-dev.lovable.app",
  "http://localhost:8080",
]);

const bodySchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().max(255),
  nom: z.string().trim().min(1).max(120),
  prenom: z.string().trim().min(1).max(120),
  telephone: z.string().trim().max(40).optional().default(""),
  raison: z.string().trim().min(30).max(2000),
});

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Requêtes same-origin sans header Origin (rare) : on accepte.
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
}


export const Route = createFileRoute("/api/public/register-access")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const headers = corsHeaders(origin);
        const fail = (reason: string, status = 400) =>
          Response.json({ ok: false, reason }, { status, headers });

        try {
          if (!originAllowed(request)) return fail("forbidden", 403);

          const limited = rateLimit(`register-access:${clientIp(request)}`, 5, 60_000);
          if (!limited.ok) return fail("rate_limited", 429);

          const parsed = bodySchema.safeParse(await request.json());
          if (!parsed.success) return fail("invalid_input", 400);
          const { userId, email, nom, prenom, telephone, raison } = parsed.data;

          const admin = adminClient();
          if (!admin) {
            console.error("[register-access] service role key manquante");
            return fail("server_misconfigured", 500);
          }

          const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
          if (userErr || !userRes?.user) return fail("unknown_user", 403);
          if ((userRes.user.email ?? "").toLowerCase() !== email.toLowerCase()) {
            return fail("email_mismatch", 403);
          }

          // Profil : upsert idempotent, on conserve le statut existant si le profil existe.
          const { data: existingProfil } = await admin
            .from("profils")
            .select("id, statut")
            .eq("id", userId)
            .maybeSingle();

          const { error: profilErr } = await admin.from("profils").upsert(
            {
              id: userId,
              email,
              nom,
              prenom,
              telephone,
              raison,
              marque: MARQUE,
              statut: existingProfil?.statut ?? "en_attente",
            },
            { onConflict: "id" },
          );
          if (profilErr) {
            console.error("[register-access] upsert profils", profilErr);
            return fail("profil_error", 500);
          }

          // Demande d'accès : clé composite (user_id, marque), pas de colonne id.
          const { data: existingDemande } = await admin
            .from("demandes_acces")
            .select("user_id, marque, statut")
            .eq("user_id", userId)
            .eq("marque", MARQUE)
            .maybeSingle();

          if (!existingDemande) {
            const { error: demandeErr } = await admin
              .from("demandes_acces")
              .insert({ user_id: userId, marque: MARQUE, raison, statut: "en_attente" });
            if (demandeErr) {
              console.error("[register-access] insert demandes_acces", demandeErr);
              return fail("demande_error", 500);
            }
          }

          return Response.json(
            { ok: true, created: !existingDemande, statut: existingDemande?.statut ?? "en_attente" },
            { headers },
          );
        } catch (e: any) {
          console.error("[register-access]", e);
          return fail("server_error", 500);
        }
      },
    },
  },
});
