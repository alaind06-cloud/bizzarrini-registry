import { createFileRoute, Link } from "@tanstack/react-router";
import { books, type Book } from "@/data/books-data";
import { useI18n } from "@/lib/i18n";

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

function BookCard({ book, index }: { book: Book; index: number }) {
  const { t } = useI18n();
  return (
    <article className="group">
      <div className="relative aspect-[3/4] bg-surface-2 overflow-hidden border border-border shadow-[0_20px_40px_-25px_rgba(0,0,0,0.9)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-brand/60 group-hover:shadow-[0_28px_60px_-25px_rgba(220,38,38,0.35)]">
        <img
          src={book.couverture}
          alt={book.titre}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
        />
        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-[0.2em] bg-background/80 backdrop-blur border border-border px-2 py-1 text-muted-foreground">
          N° {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h2 className="mt-4 font-display text-base leading-snug">{book.titre}</h2>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Philippe Olczyk</p>
      {book.lienAchat && (
        <a
          href={book.lienAchat}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs uppercase tracking-widest text-brand hover:underline"
        >
          {t("books.buy")}
        </a>
      )}
    </article>
  );
}

function BooksPage() {
  const { t } = useI18n();
  const bizzarriniBooks = books.slice(0, 3);
  const otherBooks = books.slice(3);

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("books.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("books.title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("books.lead")}</p>
      </header>

      <section className="mb-14">
        <div className="mb-6 max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl">{t("books.bizzarriniTitle")}</h2>
          <p className="mt-3 text-sm text-foreground/90 italic border-l-2 border-brand/60 pl-3">
            {t("books.bizzarriniNote")}{" "}
            <Link to="/expert-certificate" className="not-italic text-brand hover:underline">
              {t("common.learnMore")}
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
          {bizzarriniBooks.map((b, i) => (
            <BookCard key={b.couverture} book={b} index={i} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl md:text-3xl mb-6">{t("books.othersTitle")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
          {otherBooks.map((b, i) => (
            <BookCard key={b.couverture} book={b} index={i + 3} />
          ))}
        </div>
      </section>
    </div>
  );
}
