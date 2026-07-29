import { createFileRoute } from "@tanstack/react-router";

const ADMIN_EMAIL = "registerbizz@gmail.com";

export const Route = createFileRoute("/api/notify-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { nom, prenom, email, telephone, raison } = (await request.json()) as {
            nom?: string;
            prenom?: string;
            email?: string;
            telephone?: string;
            raison?: string;
          };

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
