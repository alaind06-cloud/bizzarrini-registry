import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";
import { FilterPills, type ActivePill } from "@/components/FilterPills";
import giottoPhoto from "@/assets/giotto-bizzarrini-1953.jpg.asset.json";


const CANONICAL = "https://bizzarrini-registry.lovable.app/giotto-bizzarrini";

const TITLES: Record<Lang, string> = {
  fr: "Giotto Bizzarrini & Registre des Châssis — Historique & Provenance",
  en: "Giotto Bizzarrini & Chassis Register — History & Provenance",
  it: "Giotto Bizzarrini & Registro dei Telai — Storia e Provenienza",
};

const DESCRIPTIONS: Record<Lang, string> = {
  fr: "Découvrez l'histoire de Giotto Bizzarrini (Ferrari 250 GTO, Iso Grifo A3/C, Bizzarrini 5300 GT) et accédez au registre officiel châssis par châssis.",
  en: "Discover the story of Giotto Bizzarrini (Ferrari 250 GTO, Iso Grifo A3/C, Bizzarrini 5300 GT) and access the official chassis-by-chassis register.",
  it: "Scopri la storia di Giotto Bizzarrini (Ferrari 250 GTO, Iso Grifo A3/C, Bizzarrini 5300 GT) e accedi al registro ufficiale telaio per telaio.",
};

const JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${CANONICAL}#giotto-bizzarrini`,
      name: "Giotto Bizzarrini",
      birthDate: "1926-06-06",
      deathDate: "2023-05-13",
      birthPlace: { "@type": "Place", name: "Livorno, Italy" },
      jobTitle: "Automotive Engineer",
      alumniOf: { "@type": "EducationalOrganization", name: "University of Pisa" },
      knowsAbout: [
        "Ferrari 250 GTO",
        "Iso Grifo A3/C",
        "Bizzarrini 5300 GT",
        "Bizzarrini P538",
        "Lamborghini V12 Engine",
      ],
    },
    {
      "@type": "DataCatalog",
      "@id": `${CANONICAL}#chassis-register`,
      name: "Giotto Bizzarrini Chassis Register",
      description:
        "Historical register documenting surviving chassis connected to Giotto Bizzarrini's work.",
      about: { "@id": `${CANONICAL}#giotto-bizzarrini` },
    },
  ],
};

type GiottoSearch = { m?: string; d?: string; q?: string };

export const Route = createFileRoute("/giotto-bizzarrini")({
  validateSearch: (search: Record<string, unknown>): GiottoSearch => ({
    m: typeof search.m === "string" && search.m.trim() ? search.m.trim() : undefined,
    d: typeof search.d === "string" && search.d.trim() ? search.d.trim() : undefined,
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLES.en },
      { name: "description", content: DESCRIPTIONS.en },
      { property: "og:title", content: TITLES.en },
      { property: "og:description", content: DESCRIPTIONS.en },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLES.en },
      { name: "twitter:description", content: DESCRIPTIONS.en },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "alternate", hrefLang: "fr", href: CANONICAL },
      { rel: "alternate", hrefLang: "en", href: CANONICAL },
      { rel: "alternate", hrefLang: "it", href: CANONICAL },
      { rel: "alternate", hrefLang: "x-default", href: CANONICAL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(JSONLD),
      },
    ],
  }),
  component: GiottoPage,
});

function GiottoPage() {
  const { lang, t } = useI18n();
  const { m: currentM, d: currentD, q: currentQ } = Route.useSearch();
  const navigate = useNavigate({ from: "/giotto-bizzarrini" });
  const backSearch: { m?: string; d?: string; q?: string } = {};
  if (currentM) backSearch.m = currentM;
  if (currentD) backSearch.d = currentD;
  if (currentQ) backSearch.q = currentQ;

  const clear = (key: "m" | "d" | "q") =>
    navigate({ search: (prev: GiottoSearch) => ({ ...prev, [key]: undefined }), replace: true });

  const activePills: ActivePill[] = [];
  if (currentM) activePills.push({ key: "m", label: t("home.filter.model"), value: currentM, onRemove: () => clear("m") });
  if (currentD) activePills.push({ key: "d", label: t("home.filter.decade"), value: `${currentD}s`, onRemove: () => clear("d") });
  if (currentQ) activePills.push({ key: "q", label: t("home.filter.search"), value: currentQ, onRemove: () => clear("q") });

  const content = COPY[lang];

  return (
    <div>
      <section className="border-b border-border bg-surface/40">
        <div className="container-page py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">{content.kicker}</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl leading-[1.05] max-w-4xl">
            {content.h1a} <span className="text-brand">{content.h1b}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
            {content.dates}
          </p>
        </div>
      </section>

      {activePills.length > 0 && (
        <div className="container-page pt-4">
          <FilterPills pills={activePills} />
        </div>
      )}



      <article className="container-page py-12 md:py-16 grid gap-12 lg:grid-cols-[1fr_320px] items-start">
        <div className="prose-invert max-w-3xl space-y-6 text-foreground/90 leading-relaxed">
          {content.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          <h2 className="font-display text-2xl md:text-3xl mt-12">{content.aboutTitle}</h2>
          <p>{content.aboutBody}</p>
        </div>

        <aside className="lg:sticky lg:top-24 border border-border bg-surface/60 rounded-sm p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {content.exploreKicker}
          </p>
          <h2 className="mt-2 font-display text-xl">{content.exploreTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                to="/"
                search={{ m: "A3/C" }}
                hash="registre"
                className="text-foreground hover:text-brand underline underline-offset-4 decoration-border hover:decoration-brand transition-colors"
              >
                Iso Grifo A3/C →
              </Link>
            </li>
            <li>
              <Link
                to="/"
                search={{ m: "5300 GT" }}
                hash="registre"
                className="text-foreground hover:text-brand underline underline-offset-4 decoration-border hover:decoration-brand transition-colors"
              >
                Bizzarrini 5300 GT →
              </Link>
            </li>
            <li>
              <Link
                to="/"
                search={{ m: "P538" }}
                hash="registre"
                className="text-foreground hover:text-brand underline underline-offset-4 decoration-border hover:decoration-brand transition-colors"
              >
                Bizzarrini P538 →
              </Link>
            </li>
          </ul>
          <div className="mt-6 pt-6 border-t border-border">
            <Link to="/" search={backSearch} hash="registre" className="btn-brand w-full text-center">
              {t("home.cta.catalog")}
            </Link>
          </div>
        </aside>
      </article>
    </div>
  );
}

type Copy = {
  kicker: string;
  h1a: string;
  h1b: string;
  dates: string;
  paragraphs: string[];
  aboutTitle: string;
  aboutBody: string;
  exploreKicker: string;
  exploreTitle: string;
};

const COPY: Record<Lang, Copy> = {
  fr: {
    kicker: "Portrait",
    h1a: "Giotto Bizzarrini —",
    h1b: "l'ingénieur derrière la légende",
    dates: "1926 – 2023 · Livorno, Italie",
    paragraphs: [
      "Giotto Bizzarrini (1926–2023) était un ingénieur automobile italien dont le travail a façonné quelques-unes des voitures de sport les plus emblématiques du XXᵉ siècle — bien avant que son nom ne figure sur la calandre d'une automobile.",
      "Diplômé en ingénierie mécanique de l'Université de Pise, ce natif de Livourne débute chez Alfa Romeo avant de rejoindre Ferrari en 1957 pour diriger le Reparto Esperienze. À Maranello, il est le maître d'œuvre du développement de la mythique Ferrari 250 GTO, tout en contribuant aux programmes de la 250 Testa Rossa et des GT de compétition à moteur avant.",
      "En 1961, Bizzarrini quitte Maranello lors du « Grand Départ » (La Fuoriuscita). Il fonde son propre bureau d'études, Autotecnica Sviluppo Progetti Bizzarrini (ASP), mettant son génie au service de constructeurs indépendants. C'est à lui que Ferruccio Lamborghini confie la conception du légendaire moteur V12 3,5 L qui équipera le prototype 350 GTV (Turin, 1963) — un bloc qui restera, sous des formes évoluées, au cœur des Lamborghini pendant des décennies. Le châssis du prototype fut réalisé chez Neri e Bonacini, avant que Gian Paolo Dallara ne le retravaille pour la 350 GT de série.",
      "Il s'associe ensuite à Renzo Rivolta chez Iso, où il se concentre sur la version compétition de la Grifo : l'A3/C (Corsa), au châssis surbaissé et au moteur reculé, assemblée à Livourne par la Carrozzeria Sports Cars de Piero Drogo — championne de catégorie aux 24 Heures du Mans. La version routière, l'A3/L (Lusso), fut quant à elle dessinée par Giorgetto Giugiaro chez Bertone pour la production en série sous l'égide de Renzo Rivolta.",
      "En 1964, Bizzarrini franchit le pas et devient constructeur sous sa propre marque, Bizzarrini S.p.A. La 5300 GT (versions Strada et Corsa) est l'héritière directe de l'A3/C — carrosserie légère en aluminium, V8 Chevrolet Corvette monté en position centrale-avant extrême.",
    ],
    aboutTitle: "À propos de ce registre",
    aboutBody:
      "Ce registre est dédié au recensement et à la documentation, châssis par châssis, des automobiles nées du génie de Giotto Bizzarrini — des prototypes Iso Grifo aux Bizzarrini 5300 GT et P538. Son objectif est de préserver la traçabilité et le patrimoine technique de chaque exemplaire pour les collectionneurs, historiens et passionnés.",
    exploreKicker: "Explorer",
    exploreTitle: "Les modèles au registre",
  },
  en: {
    kicker: "Portrait",
    h1a: "Giotto Bizzarrini —",
    h1b: "the engineer behind the legend",
    dates: "1926 – 2023 · Livorno, Italy",
    paragraphs: [
      "Giotto Bizzarrini (1926–2023) was an Italian automotive engineer whose work shaped some of the most iconic sports cars of the 20th century — long before his own name appeared on a car's grille.",
      "A graduate in mechanical engineering from the University of Pisa, this Livorno native began his career at Alfa Romeo before joining Ferrari in 1957 to lead the Reparto Esperienze (experimental department). At Maranello, he was the driving force behind the development of the legendary Ferrari 250 GTO, while also contributing to the 250 Testa Rossa and the front-engined GT racing programme.",
      "In 1961, Bizzarrini left Maranello during the \"Great Walkout\" (La Fuoriuscita). He founded his own engineering firm, Autotecnica Sviluppo Progetti Bizzarrini (ASP), lending his talent to independent manufacturers. Ferruccio Lamborghini entrusted him with designing the legendary 3.5-litre V12 engine that powered the 350 GTV prototype (Turin, 1963) — a unit that, in evolved form, would remain at the heart of Lamborghini's cars for decades. The prototype's chassis was built by Neri e Bonacini, before Gian Paolo Dallara reworked it for the production 350 GT.",
      "He then partnered with Renzo Rivolta at Iso, focusing on the competition version of the Grifo: the A3/C (Corsa), with its lowered chassis and rear-set engine, assembled in Livorno by Piero Drogo's Carrozzeria Sports Cars — a class winner at the 24 Hours of Le Mans. The road-going A3/L (Lusso) was styled by Giorgetto Giugiaro at Bertone for series production under Renzo Rivolta.",
      "In 1964, Bizzarrini took the leap and became a manufacturer in his own right under the Bizzarrini S.p.A. marque. The 5300 GT (Strada and Corsa versions) is the direct heir to the A3/C — a lightweight aluminium body around a Chevrolet Corvette V8, mounted in an extreme front-mid position.",
    ],
    aboutTitle: "About this register",
    aboutBody:
      "This register exists to document, chassis by chassis, the cars born from Giotto Bizzarrini's engineering genius — from the Iso Grifo prototypes to the Bizzarrini 5300 GT and P538. Its purpose is to preserve the traceability and technical heritage of each individual car for the collectors, historians, and enthusiasts who continue to care for them.",
    exploreKicker: "Explore",
    exploreTitle: "Models in the register",
  },
  it: {
    kicker: "Ritratto",
    h1a: "Giotto Bizzarrini —",
    h1b: "l'ingegnere dietro la leggenda",
    dates: "1926 – 2023 · Livorno, Italia",
    paragraphs: [
      "Giotto Bizzarrini (1926–2023) è stato un ingegnere automobilistico italiano il cui lavoro ha plasmato alcune delle vetture sportive più iconiche del XX secolo — molto prima che il suo nome comparisse sulla calandra di un'automobile.",
      "Laureato in ingegneria meccanica all'Università di Pisa, questo nativo di Livorno inizia la carriera in Alfa Romeo prima di entrare in Ferrari nel 1957 per dirigere il Reparto Esperienze. A Maranello è l'artefice dello sviluppo della leggendaria Ferrari 250 GTO, contribuendo anche alla 250 Testa Rossa e al programma corse GT a motore anteriore.",
      "Nel 1961, Bizzarrini lascia Maranello durante la \"Grande Fuoriuscita\". Fonda il proprio studio di ingegneria, Autotecnica Sviluppo Progetti Bizzarrini (ASP), mettendo il suo genio al servizio di costruttori indipendenti. Ferruccio Lamborghini gli affida la progettazione del leggendario motore V12 3,5 litri che equipaggerà il prototipo 350 GTV (Torino, 1963) — un propulsore che, in forma evoluta, rimarrà al cuore delle Lamborghini per decenni. Il telaio del prototipo fu realizzato da Neri e Bonacini, prima che Gian Paolo Dallara lo rielaborasse per la 350 GT di serie.",
      "Si associa quindi a Renzo Rivolta in Iso, concentrandosi sulla versione competizione della Grifo: la A3/C (Corsa), dal telaio ribassato e motore arretrato, assemblata a Livorno dalla Carrozzeria Sports Cars di Piero Drogo — vincitrice di classe alla 24 Ore di Le Mans. La versione stradale, la A3/L (Lusso), fu disegnata da Giorgetto Giugiaro presso Bertone per la produzione in serie sotto la guida di Renzo Rivolta.",
      "Nel 1964, Bizzarrini compie il grande passo e diventa costruttore in proprio con il marchio Bizzarrini S.p.A. La 5300 GT (versioni Strada e Corsa) è l'erede diretta della A3/C — carrozzeria leggera in alluminio attorno a un V8 Chevrolet Corvette, montato in posizione centrale-anteriore estrema.",
    ],
    aboutTitle: "Informazioni su questo registro",
    aboutBody:
      "Questo registro è dedicato al censimento e alla documentazione, telaio per telaio, delle vetture nate dal genio di Giotto Bizzarrini — dai prototipi Iso Grifo alle Bizzarrini 5300 GT e P538. Il suo scopo è preservare la tracciabilità e il patrimonio tecnico di ogni esemplare per collezionisti, storici e appassionati.",
    exploreKicker: "Esplora",
    exploreTitle: "I modelli nel registro",
  },
};
