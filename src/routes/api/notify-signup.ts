import { createFileRoute } from "@tanstack/react-router";
import { clientIp, rateLimit } from "@/lib/rate-limit.server";

const ADMIN_EMAIL = "registerbizz@gmail.com";

/** Une inscription est « réelle » si le profil vient d'être créé (< 10 min). */
const MAX_PROFIL_AGE_MS = 10 * 60 * 1000;

export const Route = createFileRoute("/api/notify-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // 1. Anti-spam : 3 requêtes / minute / IP.
          const ip = clientIp(request);
          const limited = rateLimit(`notify-signup:${ip}`, 3, 60_000);
          if (!limited.ok) {
            return Response.json(
              { ok: false, emailed: false, reason: "rate_limited" },
              { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
            );
          }

          const { nom, prenom, email, telephone, raison } = (await request.json()) as {
            nom?: string;
            prenom?: string;
            email?: string;
            telephone?: string;
            raison?: string;
          };

          // 2. Vérification que la requête correspond à une inscription réelle :
          //    un profil « en_attente » créé il y a moins de 10 minutes doit exister.
          if (!email) {
            return Response.json({ ok: false, emailed: false, reason: "missing_email" }, { status: 400 });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: profil } = await supabaseAdmin
            .from("profils")
            .select("id, created_at, statut")
            .eq("email", email)
            .maybeSingle();

          const createdAt = profil?.created_at ? Date.parse(profil.created_at) : NaN;
          const recent = Number.isFinite(createdAt) && Date.now() - createdAt < MAX_PROFIL_AGE_MS;
          if (!profil || !recent) {
            console.warn("[notify-signup] requête refusée (aucune inscription récente pour cet email)");
            return Response.json({ ok: false, emailed: false, reason: "no_recent_signup" }, { status: 403 });
          }

          const resendKey =
            process.env.RESEND_API_KEY ||
            process.env.RESEND_KEY ||
            process.env.VITE_RESEND_API_KEY;

          if (!resendKey) {
            // Non bloquant pour l'inscription, mais l'échec doit être VISIBLE (logs + statut HTTP).
            console.error(
              "[notify-signup] RESEND_API_KEY absente de l'environnement serveur : aucune notification envoyée. " +
                "Ajouter la variable d'environnement RESEND_API_KEY sur l'hébergeur (Vercel > Settings > Environment Variables) puis redéployer.",
            );
            return Response.json(
              { ok: false, emailed: false, reason: "no_resend_key" },
              { status: 500 },
            );
          }

          const fullName = [prenom, nom].filter(Boolean).join(" ") || email || "Inconnu";
          const esc = (s?: string | null) =>
            (s ?? "—").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

          const html = `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
              <h2 style="font-family:'Playfair Display',Georgia,serif;margin:0 0 16px">Nouvelle demande d'accès</h2>
              <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:4px 12px 4px 0;color:#666">Prénom</td><td><b>${esc(prenom)}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Nom</td><td><b>${esc(nom)}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><b>${esc(email)}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Téléphone</td><td><b>${esc(telephone)}</b></td></tr>
                ${raison ? `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">Raison</td><td>${esc(raison)}</td></tr>` : ""}
              </table>
              <p style="font-size:12px;color:#666;margin-top:24px">Valider ou refuser depuis l'espace admin du site.</p>
            </div>
          `;

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Bizzarrini Register <noreply@registerbizzarrini.com>",
              reply_to: email || undefined,
              to: [ADMIN_EMAIL],
              subject: `Nouvelle demande d'accès - ${fullName}`,
              html,
            }),
          });

          if (!emailRes.ok) {
            const body = await emailRes.text();
            console.error("[notify-signup] Resend error", emailRes.status, body);
            return Response.json(
              { ok: false, emailed: false, status: emailRes.status, error: body.slice(0, 500) },
              { status: 502 },
            );
          }

          console.info("[notify-signup] email envoyé à", ADMIN_EMAIL);
          return Response.json({ ok: true, emailed: true });
        } catch (e: any) {
          console.error("[notify-signup]", e);
          return Response.json(
            { ok: false, emailed: false, error: e?.message },
            { status: 500 },
          );
        }
      },
    },
  },
});
