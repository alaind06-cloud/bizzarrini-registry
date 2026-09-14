import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase, SITE_MARQUE } from "@/lib/supabase";
import { SITEMAP_BASE } from "@/lib/seo";
import { coverUrl, coverAlt } from "@/lib/supabase-env";

function chassisToSlug(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Échappe le texte inséré dans le XML (& < > " '). */
const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

interface SitemapImage {
  loc: string;
  title?: string;
}

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  images?: SitemapImage[];
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/giotto-bizzarrini", changefreq: "monthly", priority: "0.9" },
  { path: "/expert-certificate", changefreq: "monthly", priority: "0.8" },
  { path: "/books", changefreq: "monthly", priority: "0.7" },
  { path: "/videos", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const { data } = await supabase
            .from("voitures")
            .select("id, chassis, titre, modele, annee, cover_photo, storage_path")
            .eq("marque", SITE_MARQUE)
            .order("id", { ascending: true });

          // Covers du catalogue : indexables via la page d'accueil, où elles
          // sont publiquement visibles (les fiches détaillées restent réservées
          // aux membres).
          const coverImages: SitemapImage[] = [];
          for (const car of data ?? []) {
            const slug = chassisToSlug(car.chassis) || chassisToSlug(car.titre);
            if (slug) entries.push({ path: `/chassis/${slug}`, changefreq: "monthly", priority: "0.6" });

            const loc = coverUrl(car.cover_photo, { path: car.storage_path, width: 760 });
            if (loc) {
              coverImages.push({
                loc: `${SITEMAP_BASE}${loc}`,
                title: coverAlt(car),
              });
            }
          }

          const home = entries.find((e) => e.path === "/");
          if (home && coverImages.length) home.images = coverImages;
        } catch {
          // Le sitemap reste valide avec les pages statiques si Supabase est indisponible.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${SITEMAP_BASE}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            ...(e.images ?? []).map((img) =>
              [
                `    <image:image>`,
                `      <image:loc>${xmlEscape(img.loc)}</image:loc>`,
                img.title ? `      <image:title>${xmlEscape(img.title)}</image:title>` : null,
                `    </image:image>`,
              ]
                .filter(Boolean)
                .join("\n"),
            ),
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
