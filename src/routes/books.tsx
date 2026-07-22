import { createFileRoute } from "@tanstack/react-router";
import { books } from "@/data/books-data";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Livres — Bizzarrini Register" },
      {
        name: "description",
        content: "Les 11 ouvrages de référence signés Philippe Olczyk : Bizzarrini, Ferrari, Lancia, Porsche, Ford, Alfa Romeo, De Tomaso.",
      },
      { property: "og:title", content: "Livres — Philippe Olczyk" },
      { property: "og:description", content: "Bibliographie de référence sur les voitures de course historiques." },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Bibliographie</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Livres</h1>
        <p className="mt-4 text-muted-foreground">
          Les ouvrages de référence publiés par Philippe Olczyk sur les grandes voitures de course.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
        {books.map((b, i) => (
          <article key={b.couverture} className="group">
            <div className="relative aspect-[3/4] bg-surface-2 overflow-hidden border border-border shadow-[0_20px_40px_-25px_rgba(0,0,0,0.9)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-brand/60 group-hover:shadow-[0_28px_60px_-25px_rgba(220,38,38,0.35)]">
              <img
                src={b.couverture}
                alt={b.titre}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              />
              <span className="absolute top-2 left-2 text-[10px] uppercase tracking-[0.2em] bg-background/80 backdrop-blur border border-border px-2 py-1 text-muted-foreground">
                N° {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-4 font-display text-base leading-snug">{b.titre}</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Philippe Olczyk</p>
            {b.lienAchat && (
              <a
                href={b.lienAchat}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs uppercase tracking-widest text-brand hover:underline"
              >
                Acheter →
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
