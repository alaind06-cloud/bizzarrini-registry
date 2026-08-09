import { createFileRoute } from "@tanstack/react-router";
import { clientIp, rateLimit } from "@/lib/rate-limit.server";

const ADMIN_EMAIL = "registerbizz@gmail.com";

const esc = (s?: string | null) =>
  (s ?? "—").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = clientIp(request);
          const limited = rateLimit(`contact:${ip}`, 3, 60_000);
          if (!limited.ok) {
            return Response.json(
              { ok: false, reason: "rate_limited" },
              { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
            );
          }

          const body = (await request.json()) as {
            nom?: string;
            email?: string;
            message?: string;
          };
          const nom = (body.nom ?? "").trim();
          const email = (body.email ?? "").trim();
          const message = (body.message ?? "").trim();

          if (
            nom.length < 1 ||
            nom.length > 100 ||
            email.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            message.length < 10 ||
            message.length > 2000
          ) {
            return Response.json({ ok: false, reason: "invalid_input" }, { status: 400 });
          }

          const resendKey =
            process.env.RESEND_API_KEY || process.env.RESEND_KEY || process.env.VITE_RESEND_API_KEY;

          if (!resendKey) {
            console.error("[contact] RESEND_API_KEY absente : message non délivré.");
            return Response.json({ ok: false, reason: "no_resend_key" }, { status: 500 });
          }

          const html = `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
              <h2 style="font-family:'Playfair Display',Georgia,serif;margin:0 0 16px">Nouveau message — formulaire de contact</h2>
              <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:4px 12px 4px 0;color:#666">Nom</td><td><b>${esc(nom)}</b></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><b>${esc(email)}</b></td></tr>
              </table>
              <div style="white-space:pre-wrap;border-top:1px solid #eee;padding-top:16px">${esc(message)}</div>
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
              reply_to: email,
              to: [ADMIN_EMAIL],
              subject: `Contact site — ${nom}`,
              html,
            }),
          });

          if (!emailRes.ok) {
            const text = await emailRes.text();
            console.error("[contact] Resend error", emailRes.status, text);
            return Response.json({ ok: false, reason: "send_failed" }, { status: 502 });
          }

          return Response.json({ ok: true });
        } catch (e: any) {
          console.error("[contact]", e);
          return Response.json({ ok: false, reason: "error" }, { status: 500 });
        }
      },
    },
  },
});
