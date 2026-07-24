import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/expert-certificate")({
  head: () => ({
    meta: [
      { title: "Expert & Certificat — Philippe Olczyk | Bizzarrini Register" },
      {
        name: "description",
        content:
          "Philippe Olczyk, seul expert au monde reconnu par Giotto Bizzarrini lui-même, détenteur du certificat officiel d'expertise et d'archiviste de la marque.",
      },
      { property: "og:title", content: "Expert & Certificat — Philippe Olczyk" },
      {
        property: "og:description",
        content:
          "Reconnaissance directe par Giotto Bizzarrini, signatures conjointes sur les certificats d'authenticité, accès aux registres d'usine de Livourne.",
      },
    ],
  }),
  component: ExpertCertificatePage,
});

function ExpertCertificatePage() {
  const { t } = useI18n();

  const bullets: { title: string; body: string }[] = [
    { title: t("expert.point1.title"), body: t("expert.point1.body") },
    { title: t("expert.point2.title"), body: t("expert.point2.body") },
    { title: t("expert.point3.title"), body: t("expert.point3.body") },
  ];

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("expert.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("expert.title")}</h1>
        <p className="mt-6 text-lg text-foreground/90 leading-relaxed">{t("expert.intro")}</p>
      </header>

      <section className="max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl mb-6">{t("expert.whyTitle")}</h2>
        <ul className="space-y-6">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="border-l-2 border-brand/60 pl-4 py-1"
            >
              <h3 className="font-display text-lg text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{b.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/books" className="btn-ghost">{t("expert.cta.books")}</Link>
          <Link to="/videos" className="btn-ghost">{t("expert.cta.videos")}</Link>
          <Link to="/contact" className="btn-brand">{t("expert.cta.contact")}</Link>
        </div>
      </section>
    </div>
  );
}
