import { createFileRoute } from "@tanstack/react-router";
import { clientIp, rateLimit } from "@/lib/rate-limit.server";

/**
 * Écriture des photos du registre dans le bucket Cloudflare R2.
 * Réservé aux administrateurs (`profils.est_admin`). Plus aucune écriture ne
 * passe par Supabase Storage.
 *
 * - Upload / remplacement : POST binaire, en-têtes `x-photo-filename` et
 *   `x-photo-op` (`upload` | `replace`).
 * - Renommage / suppression : POST JSON `{ op: "move" | "delete", ... }`.
 */

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token.split(".").length !== 3) return { error: "unauthorized" as const, status: 401 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !userData?.user) return { error: "unauthorized" as const, status: 401 };

  const { data: profil } = await supabaseAdmin
    .from("profils")
    .select("est_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profil?.est_admin) return { error: "forbidden" as const, status: 403 };
  return { error: null };
}

const clean = (name: unknown) =>
  typeof name === "string" && /^[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(name) ? name : null;

export const Route = createFileRoute("/api/admin-photos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth.error) return Response.json({ ok: false, reason: auth.error }, { status: auth.status });

        const limited = rateLimit(`r2:${clientIp(request)}`, 240, 60_000);
        if (!limited.ok) {
          return Response.json(
            { ok: false, reason: "rate_limit" },
            { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
          );
        }

        try {
          const { r2Delete, r2Exists, r2Move, r2Put } = await import("@/lib/r2.server");
          const contentType = request.headers.get("content-type") ?? "";

          if (contentType.includes("application/json")) {
            const body = (await request.json()) as { op?: string; from?: string; to?: string; filename?: string };
            if (body.op === "move") {
              const from = clean(body.from);
              const to = clean(body.to);
              if (!from || !to) return Response.json({ ok: false, reason: "bad_filename" }, { status: 400 });
              await r2Move(from, to);
              return Response.json({ ok: true });
            }
            if (body.op === "delete") {
              const filename = clean(body.filename);
              if (!filename) return Response.json({ ok: false, reason: "bad_filename" }, { status: 400 });
              await r2Delete(filename);
              return Response.json({ ok: true });
            }
            return Response.json({ ok: false, reason: "bad_op" }, { status: 400 });
          }

          const filename = clean(request.headers.get("x-photo-filename"));
          if (!filename) return Response.json({ ok: false, reason: "bad_filename" }, { status: 400 });
          const op = request.headers.get("x-photo-op") === "replace" ? "replace" : "upload";
          if (op === "upload" && (await r2Exists(filename))) {
            return Response.json({ ok: false, reason: "already_exists" }, { status: 409 });
          }
          const buffer = await request.arrayBuffer();
          if (!buffer.byteLength) return Response.json({ ok: false, reason: "empty_body" }, { status: 400 });
          await r2Put(filename, buffer, contentType || "image/jpeg");
          return Response.json({ ok: true });
        } catch (e) {
          console.error("[admin-photos]", e);
          return Response.json({ ok: false, reason: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
