import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rbrkzrtrlvihpjugksnb.supabase.co";

export const Route = createFileRoute("/api/valider")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { token } = (await request.json()) as { token?: string };
          if (!token) return Response.json({ ok: false, error: "Token manquant" }, { status: 400 });

          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceKey) return Response.json({ ok: false, error: "Config serveur" }, { status: 500 });

          const admin = createClient(SUPABASE_URL, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: row, error } = await admin
            .from("validation_tokens")
            .select("token, profil_id, utilise, expires_at")
            .eq("token", token)
            .maybeSingle();

          if (error || !row) {
            return Response.json({ ok: false, error: "Lien invalide" }, { status: 404 });
          }
          if (row.utilise) {
            return Response.json({ ok: false, error: "Ce lien a déjà été utilisé." }, { status: 410 });
          }
          if (new Date(row.expires_at) < new Date()) {
            return Response.json({ ok: false, error: "Ce lien a expiré." }, { status: 410 });
          }

          const { error: uErr } = await admin
            .from("profils")
            .update({ statut: "valide" })
            .eq("id", row.profil_id);
          if (uErr) return Response.json({ ok: false, error: uErr.message }, { status: 500 });

          await admin.from("validation_tokens").update({ utilise: true }).eq("token", token);

          return Response.json({ ok: true });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "Erreur" }, { status: 500 });
        }
      },
    },
  },
});
