import { canonical } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { videos, genepifilmSeries, toYoutubeEmbed, toFacebookEmbed, videoObjectsJsonLd, type Video } from "@/data/videos-data";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vidéos — Bizzarrini Register" },
      {
        name: "description",
        content: "Vidéos documentaires, essais et courses des Bizzarrini authentifiées par le registre.",
      },
      { property: "og:title", content: "Vidéos Bizzarrini — Registre officiel" },
      { property: "og:description", content: "Archive vidéo des Bizzarrini de compétition et de route." },
      { property: "og:url", content: canonical("/videos") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: canonical("/videos") }],
  }),
  component: VideosPage,
});

function VideoCard({ v, label }: { v: Video; label?: string }) {
  const { t } = useI18n();
  const src = v.plateforme === "youtube" ? toYoutubeEmbed(v.url) : toFacebookEmbed(v.url);
  return (
    <article className="group bg-card border border-border overflow-hidden hover:border-brand/60 transition-colors">
      <div className="aspect-video bg-surface-2 relative">
        {src ? (
          <iframe
            src={src}
            title={v.titre}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">
            {t("videos.unsupported")}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug truncate">{label ?? v.titre}</h3>
          {v.sousTitre && (
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{v.sousTitre}</p>
          )}
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-brand border border-brand/40 rounded-sm px-2 py-1">
          {v.plateforme === "youtube" ? "YouTube" : "Facebook"}
        </span>
      </div>
    </article>
  );
}

function VideosPage() {
  const { t } = useI18n();
  return (
    <div className="container-page py-12 md:py-16">
      {videoObjectsJsonLd([...genepifilmSeries, ...videos]).map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <header className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("videos.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("videos.title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("videos.lead")}</p>
      </header>

      {/* Featured Genepifilm series */}
      <section className="mb-16 border border-brand/40 bg-card/60 p-5 md:p-8 rounded-sm">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-block text-[10px] uppercase tracking-[0.25em] text-brand border border-brand/60 rounded-sm px-2 py-1">
            {t("videos.featuredBadge")}
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl leading-snug">{t("videos.featuredTitle")}</h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{t("videos.featuredLead")}</p>
        <p className="mt-3 text-sm max-w-3xl text-foreground/90 italic border-l-2 border-brand/60 pl-3">
          {t("videos.featuredNote")}{" "}
          <Link to="/expert-certificate" className="not-italic text-brand hover:underline">
            {t("car.provenance.link")}
          </Link>
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {genepifilmSeries.map((v, i) => (
            <VideoCard key={v.id} v={v} label={`${t("videos.partLabel")} ${i + 1}`} />
          ))}
        </div>
      </section>

      <h2 className="font-display text-2xl md:text-3xl mb-6">{t("videos.othersTitle")}</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {videos.map((v) => (
          <VideoCard key={v.id} v={v} />
        ))}
      </div>
    </div>
  );
}
