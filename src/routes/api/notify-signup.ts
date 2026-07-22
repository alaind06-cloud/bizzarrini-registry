import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rbrkzrtrlvihpjugksnb.supabase.co";
const ADMIN_EMAIL = "alaind06@gmail.com";

export const Route = createFileRoute("/api/notify-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { profil_id } = (await request.json()) as { profil_id?: string };
          if (!profil_id) {
            return Response.json({ error: "profil_id requis" }, { status: 400 });
          }

          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const resendKey = process.env.RESEND_API_KEY;
          if (!serviceKey || !resendKey) {
            return Response.json({ error: "Secrets non configurés" }, { status: 500 });
          }

          const admin = createClient(SUPABASE_URL, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: profil, error: pErr } = await admin
            .from("profils")
            .select("id, nom, prenom, email, telephone")
            .eq("id", profil_id)
            .maybeSingle();
          if (pErr || !profil) {
            return Response.json({ error: "Profil introuvable" }, { status: 404 });
          }

          const { data: tok, error: tErr } = await admin
            .from("validation_tokens")
            .insert({ profil_id })
            .select("token")
            .single();
          if (tErr || !tok) {
            return Response.json({ error: tErr?.message ?? "Token" }, { status: 500 });
          }

          const origin = new URL(request.url).origin;
          const link = `${origin}/valider?token=${tok.token}`;
          const fullName = [profil.prenom, profil.nom].filter(Boolean).join(" ") || profil.email;

          const html = `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
              <h2 style="font-family:'Playfair Display',Georgia,serif;margin:0 0 16px">Nouvelle demande d'accès</h2>
              <p>Une nouvelle inscription est en attente de validation :</p>
              <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:4px 12px 4px 0;color:#666">Nom</td><td><b>${profil.nom ?? "—"}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Prénom</td><td><b>${profil.prenom ?? "—"}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><b>${profil.email ?? "—"}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Téléphone</td><td><b>${profil.telephone ?? "—"}</b></td></tr>
              </table>
              <p style="margin:24px 0">
                <a href="${link}" style="background:#c8102e;color:#fff;text-decoration:none;padding:12px 24px;font-weight:600;display:inline-block">Valider ce membre</a>
              </p>
              <p style="font-size:12px;color:#666">Ou copiez ce lien dans votre navigateur :<br>${link}</p>
              <p style="font-size:12px;color:#666;margin-top:24px">Le lien expire dans 30 jours et ne peut être utilisé qu'une seule fois.</p>
            </div>
          `;

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Bizzarrini Register <onboarding@resend.dev>",
              to: [ADMIN_EMAIL],
              subject: `Nouvelle demande d'accès - ${fullName}`,
              html,
            }),
          });

          if (!emailRes.ok) {
            const body = await emailRes.text();
            console.error("Resend error", emailRes.status, body);
            return Response.json({ error: "Envoi email échoué", detail: body }, { status: 502 });
          }

          return Response.json({ ok: true });
        } catch (e: any) {
          console.error(e);
          return Response.json({ error: e?.message ?? "Erreur" }, { status: 500 });
        }
      },
    },
  },
});
