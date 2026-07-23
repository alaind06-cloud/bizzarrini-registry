import { createFileRoute } from "@tanstack/react-router";
import { videos, toYoutubeEmbed, toFacebookEmbed } from "@/data/videos-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vidéos — Bizzarrini Register" },
      {
        name: "description",
        content: "Vidéos documentaires, essais et courses des Bizzarrini authentifiées par l'expert Lucas Bizzarrini.",
      },
      { property: "og:title", content: "Vidéos Bizzarrini — Registre officiel" },
      { property: "og:description", content: "Archive vidéo des Bizzarrini de compétition et de route." },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const { t } = useI18n();
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("videos.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("videos.title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("videos.lead")}</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {videos.map((v) => {
          const src = v.plateforme === "youtube" ? toYoutubeEmbed(v.url) : toFacebookEmbed(v.url);
          return (
            <article
              key={v.id}
              className="group bg-card border border-border overflow-hidden hover:border-brand/60 transition-colors"
            >
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
                  <h2 className="font-display text-lg leading-snug truncate">{v.titre}</h2>
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
        })}
      </div>
    </div>
  );
}
