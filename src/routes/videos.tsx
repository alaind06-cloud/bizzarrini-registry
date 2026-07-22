import { createFileRoute } from "@tanstack/react-router";
import { videos, toYoutubeEmbed, toFacebookEmbed } from "@/data/videos-data";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vidéos — Bizzarrini Register" },
      {
        name: "description",
        content: "Vidéos documentaires, essais et courses des Bizzarrini authentifiées par l'expert Philippe Olczyk.",
      },
      { property: "og:title", content: "Vidéos Bizzarrini — Registre officiel" },
      { property: "og:description", content: "Archive vidéo des Bizzarrini de compétition et de route." },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Archives audiovisuelles</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Vidéos</h1>
        <p className="mt-4 text-muted-foreground">
          Sélection de reportages, essais et courses documentant l'histoire des Bizzarrini.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {videos.map((v) => {
          const src = v.plateforme === "youtube" ? toYoutubeEmbed(v.url) : toFacebookEmbed(v.url);
          return (
            <article key={v.id} className="bg-card border border-border overflow-hidden">
              <div className="aspect-video bg-surface-2">
                {src ? (
                  <iframe
                    src={src}
                    title={v.titre ?? "Vidéo"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">
                    Format non supporté
                  </div>
                )}
              </div>
              {v.titre && <div className="p-4 text-sm">{v.titre}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
