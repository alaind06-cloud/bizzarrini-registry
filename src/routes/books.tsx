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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {books.map((b) => (
          <article key={b.couverture} className="group">
            <div className="aspect-square bg-surface-2 overflow-hidden border border-border">
              <img
                src={b.couverture}
                alt={b.titre}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
            <h2 className="mt-3 font-display text-base leading-snug">{b.titre}</h2>
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
