import { createFileRoute } from "@tanstack/react-router";
import { PHOTOS_BASE_URL } from "@/lib/supabase-env";

/**
 * Proxy de cache pour les photos de couverture publiques (bucket
 * `voitures-photos`). Supabase Storage sert ces objets avec `max-age=3600`,
 * ce qui pénalise le SEO images et la vitesse. Ici on renvoie exactement le
 * même binaire avec un cache immuable d'un an.
 *
 * Les noms de fichiers étant stables (un renommage crée une nouvelle URL),
 * `immutable` est sûr.
 */

const SAFE_PATH = /^[A-Za-z0-9/_.\- ()]+$/;

export const Route = createFileRoute("/api/public/cover/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const raw = decodeURIComponent((params as { _splat?: string })._splat ?? "");
        const path = raw.replace(/^\/+/, "");

        if (!path || path.includes("..") || !SAFE_PATH.test(path)) {
          return new Response("Bad request", { status: 400 });
        }

        const encodedPath = path
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");

        // `?w=` déclenche le redimensionnement Supabase (endpoint `render/image`),
        // qui renvoie du WebP quand le client l'accepte : on ne transfère que
        // les pixels réellement affichés.
        const wRaw = Number(new URL(request.url).searchParams.get("w"));
        const width = Number.isFinite(wRaw) && wRaw >= 64 && wRaw <= 2000 ? Math.round(wRaw) : null;

        const upstream = width
          ? `${PHOTOS_BASE_URL.replace("/object/public/", "/render/image/public/")}/${encodedPath}?width=${width}&quality=58&resize=contain`
          : `${PHOTOS_BASE_URL}/${encodedPath}`;

        const accept = request.headers.get("accept");
        const res = await fetch(upstream, accept ? { headers: { accept } } : undefined);
        if (!res.ok || !res.body) {
          return new Response("Not found", {
            status: res.status === 404 ? 404 : 502,
            headers: { "Cache-Control": "public, max-age=60" },
          });
        }

        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
            Vary: "Accept",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
