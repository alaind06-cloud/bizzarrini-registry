import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo";

function chassisToSlug(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
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
            .select("id, chassis, titre")
            .eq("marque", SITE_MARQUE)
            .order("id", { ascending: true });

          for (const car of data ?? []) {
            const slug = chassisToSlug(car.chassis) || chassisToSlug(car.titre);
            if (slug) entries.push({ path: `/chassis/${slug}`, changefreq: "monthly", priority: "0.6" });
          }
        } catch {
          // Le sitemap reste valide avec les pages statiques si Supabase est indisponible.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${SITE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
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
