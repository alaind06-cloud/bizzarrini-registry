import { createFileRoute } from "@tanstack/react-router";
import { clientIp, rateLimit } from "@/lib/rate-limit.server";

/**
 * Écriture des photos du registre dans le bucket Supabase Storage public
 * `voitures-photos` (même bucket que celui servi en lecture par
 * `PHOTOS_BASE_URL` / `/api/public/cover`). L'ancien bucket privé `photos` et
 * l'ancien bucket Cloudflare R2 ne sont plus utilisés.
 *
 * Réservé aux administrateurs (`profils.est_admin`).
 *
 * - Upload / remplacement : POST binaire, en-têtes `x-photo-filename`,
 *   `x-photo-path` (dossier du châssis) et `x-photo-op` (`upload` | `replace`).
 * - Renommage / suppression : POST JSON `{ op: "move" | "delete", path, ... }`.
 */

export const PHOTO_BUCKET = "voitures-photos";
const DEFAULT_FOLDER = "bizzarrini";

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

/** Dossier du châssis (`voitures.storage_path`), nettoyé et validé. */
const cleanFolder = (raw: unknown) => {
  const value = typeof raw === "string" ? raw.trim().replace(/^\/+|\/+$/g, "") : "";
  if (!value) return DEFAULT_FOLDER;
  if (value.includes("..") || !/^[A-Za-z0-9 /_.()-]+$/.test(value)) return null;
  return value;
};

const objectKey = (folder: string, filename: string) => `${folder}/${filename}`;

export const Route = createFileRoute("/api/admin-photos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth.error) return Response.json({ ok: false, reason: auth.error }, { status: auth.status });

        const limited = rateLimit(`photos:${clientIp(request)}`, 240, 60_000);
        if (!limited.ok) {
          return Response.json(
            { ok: false, reason: "rate_limit" },
            { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
          );
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const storage = supabaseAdmin.storage.from(PHOTO_BUCKET);
          const contentType = request.headers.get("content-type") ?? "";

          if (contentType.includes("application/json")) {
            const body = (await request.json()) as {
              op?: string;
              from?: string;
              to?: string;
              filename?: string;
              path?: string;
            };
            const folder = cleanFolder(body.path);
            if (!folder) return Response.json({ ok: false, reason: "bad_path" }, { status: 400 });

            if (body.op === "move") {
              const from = clean(body.from);
              const to = clean(body.to);
              if (!from || !to) return Response.json({ ok: false, reason: "bad_filename" }, { status: 400 });
              const { error } = await storage.move(objectKey(folder, from), objectKey(folder, to));
              if (error) throw new Error(error.message);
              return Response.json({ ok: true });
            }
            if (body.op === "delete") {
              const filename = clean(body.filename);
              if (!filename) return Response.json({ ok: false, reason: "bad_filename" }, { status: 400 });
              const { error } = await storage.remove([objectKey(folder, filename)]);
              if (error) throw new Error(error.message);
              return Response.json({ ok: true });
            }
            return Response.json({ ok: false, reason: "bad_op" }, { status: 400 });
          }

          const filename = clean(request.headers.get("x-photo-filename"));
          if (!filename) return Response.json({ ok: false, reason: "bad_filename" }, { status: 400 });
          const folder = cleanFolder(request.headers.get("x-photo-path"));
          if (!folder) return Response.json({ ok: false, reason: "bad_path" }, { status: 400 });

          const op = request.headers.get("x-photo-op") === "replace" ? "replace" : "upload";
          const key = objectKey(folder, filename);
          const buffer = await request.arrayBuffer();
          if (!buffer.byteLength) return Response.json({ ok: false, reason: "empty_body" }, { status: 400 });

          const { error } = await storage.upload(key, buffer, {
            contentType: contentType || "image/jpeg",
            cacheControl: "31536000",
            upsert: op === "replace",
          });
          if (error) {
            const already = /exists/i.test(error.message);
            return Response.json(
              { ok: false, reason: already ? "already_exists" : error.message },
              { status: already ? 409 : 500 },
            );
          }
          return Response.json({ ok: true });
        } catch (e) {
          console.error("[admin-photos]", e);
          return Response.json({ ok: false, reason: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
