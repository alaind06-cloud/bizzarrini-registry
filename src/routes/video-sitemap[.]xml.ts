import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/seo";
import { genepifilmSeries, videos, videoObjectsJsonLd } from "@/data/videos-data";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/video-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const items = videoObjectsJsonLd([...genepifilmSeries, ...videos]) as Array<{
          name: string;
          description: string;
          thumbnailUrl: string;
          embedUrl: string;
          uploadDate?: string;
        }>;

        const blocks = items.map((v) =>
          [
            `    <video:video>`,
            `      <video:thumbnail_loc>${escapeXml(v.thumbnailUrl)}</video:thumbnail_loc>`,
            `      <video:title>${escapeXml(v.name)}</video:title>`,
            `      <video:description>${escapeXml(v.description)}</video:description>`,
            `      <video:player_loc>${escapeXml(v.embedUrl)}</video:player_loc>`,
            v.uploadDate ? `      <video:publication_date>${v.uploadDate}</video:publication_date>` : null,
            `    </video:video>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
          `  <url>`,
          `    <loc>${SITE_URL}/videos</loc>`,
          ...blocks,
          `  </url>`,
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
