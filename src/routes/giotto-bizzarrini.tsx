import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";
import { FilterPills, type ActivePill } from "@/components/FilterPills";
import giottoPhoto from "@/assets/giotto-bizzarrini-atelier.jpg.asset.json";


import { canonical } from "@/lib/seo";

const CANONICAL = canonical("/giotto-bizzarrini");

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
      {activePills.length > 0 && (
        <div className="container-page pt-4">
          <FilterPills pills={activePills} />
        </div>
      )}

      {/* Cinematic hero — A Rebel's Vision */}
      <section className="relative bg-[#0f0d0b] text-[#f3ebdc] overflow-hidden">
        <div className="container-page py-20 md:py-32">
          <div className="grid gap-14 lg:gap-24 lg:grid-cols-2 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-6 md:-inset-10 bg-[radial-gradient(ellipse_at_center,rgba(200,160,90,0.18),transparent_70%)] pointer-events-none" />
              <figure className="relative overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                <img
                  src={giottoPhoto.url}
                  alt="Giotto Bizzarrini dans son atelier, aux côtés d'une berlinette de compétition"
                  loading="eager"
                  className="w-full h-auto object-cover grayscale-[0.15] contrast-[1.05]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-6 pt-16 pb-6">
                  <p className="font-display italic text-lg md:text-xl leading-snug text-[#f3ebdc]">
                    “The car must be beautiful, but above all, it must be fast.”
                  </p>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.35em] text-[#c8a05a]">
                    — Giotto Bizzarrini
                  </p>
                </figcaption>
              </figure>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[#c8a05a]">
                {content.legacyKicker}
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.02]">
                {content.legacyTitle}
              </h1>

              <figure className="border-l-2 border-[#c8a05a] pl-6 py-2">
                <blockquote className="font-display italic text-2xl md:text-3xl leading-snug text-[#f3ebdc]">
                  “{content.quote}”
                </blockquote>
                <figcaption className="mt-4 text-xs uppercase tracking-[0.4em] text-[#c8a05a]">
                  — Giotto Bizzarrini
                </figcaption>
              </figure>

              <p className="text-lg text-[#f3ebdc]/80 leading-relaxed max-w-xl">
                {content.legacyLead}
              </p>

              <p className="text-sm text-[#f3ebdc]/60">{content.dates}</p>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                {content.stats.map((s) => (
                  <div key={s.value}>
                    <span className="font-display text-3xl md:text-4xl text-[#c8a05a] block leading-none">
                      {s.value}
                    </span>
                    <p className="mt-2 text-[0.65rem] uppercase tracking-[0.25em] text-[#f3ebdc]/60 leading-snug">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-16 text-[0.65rem] uppercase tracking-[0.25em] text-[#f3ebdc]/40">
            {content.photoCredit}
          </p>
        </div>
      </section>


      <article className="container-page py-12 md:py-16 grid gap-12 lg:grid-cols-[1fr_320px] items-start">
        <div className="prose-invert max-w-3xl space-y-6 text-foreground/90 leading-relaxed">
          {content.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          <h2 className="font-display text-2xl md:text-3xl mt-12">{content.aboutTitle}</h2>
          <p>{content.aboutBody}</p>

          <div id="realisations" className="mt-12 pt-12 border-t border-border scroll-mt-24">
            <h2 className="font-display text-2xl md:text-3xl">{content.achievementsTitle}</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <Link
                to="/books"
                hash="ferrari-166-f50-gt"
                className="group block p-5 border border-border bg-surface/40 hover:bg-surface/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg group-hover:text-brand transition-colors">
                      {content.achievementsFerrari}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {content.achievementsFerrariDesc}
                    </p>
                  </div>
                  <span className="text-brand text-lg shrink-0">→</span>
                </div>
              </Link>
              <div className="p-5 border border-border bg-surface/40">
                <h3 className="font-display text-lg">{content.achievementsLamborghini}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {content.achievementsLamborghiniDesc}
                </p>
              </div>
            </div>
          </div>
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

type Stat = { value: string; label: string };
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
  quote: string;
  photoCredit: string;
  legacyKicker: string;
  legacyTitle: string;
  legacyLead: string;
  stats: Stat[];
  achievementsTitle: string;
  achievementsFerrari: string;
  achievementsLamborghini: string;
  achievementsFerrariDesc: string;
  achievementsLamborghiniDesc: string;
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
    quote: "La voiture doit être belle, mais avant tout, elle doit être rapide.",
    photoCredit: "Photo : Giotto Bizzarrini dans son atelier — Bizzarrini Heritage",
    legacyKicker: "L'héritage",
    legacyTitle: "Un ingénieur, trois révolutions",
    legacyLead: "De la Ferrari 250 GTO à la Bizzarrini 5300 GT, en passant par le V12 Lamborghini, Giotto Bizzarrini a signé les fondations mécaniques du GT italien moderne.",
    stats: [
      { value: "1926", label: "Naissance à Livourne" },
      { value: "1961", label: "Départ de Ferrari" },
      { value: "1964", label: "Fondation Bizzarrini S.p.A." },
    ],
    achievementsTitle: "Autres réalisations majeures",
    achievementsFerrari: "Ferrari 250 GTO",
    achievementsLamborghini: "V12 Lamborghini",
    achievementsFerrariDesc:
      "Maître d'œuvre du développement de la Ferrari 250 GTO à Maranello. Voir l'ouvrage de référence « Ferrari 166 to F50 GT ».",
    achievementsLamborghiniDesc:
      "Conception du légendaire moteur V12 3,5 L pour le prototype Lamborghini 350 GTV — un bloc qui restera au cœur des Lamborghini pendant des décennies.",
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
    quote: "The car must be beautiful, but above all, it must be fast.",
    photoCredit: "Photo: Giotto Bizzarrini in his workshop — Bizzarrini Heritage",
    legacyKicker: "The legacy",
    legacyTitle: "One engineer, three revolutions",
    legacyLead: "From the Ferrari 250 GTO to the Bizzarrini 5300 GT, by way of the Lamborghini V12, Giotto Bizzarrini laid the mechanical foundations of the modern Italian GT.",
    stats: [
      { value: "1926", label: "Born in Livorno" },
      { value: "1961", label: "Left Ferrari" },
      { value: "1964", label: "Founded Bizzarrini S.p.A." },
    ],
    achievementsTitle: "Other major achievements",
    achievementsFerrari: "Ferrari 250 GTO",
    achievementsLamborghini: "Lamborghini V12",
    achievementsFerrariDesc:
      "Driving force behind the development of the Ferrari 250 GTO at Maranello. See the reference book « Ferrari 166 to F50 GT ».",
    achievementsLamborghiniDesc:
      "Designed the legendary 3.5-litre V12 engine for the Lamborghini 350 GTV prototype — a unit that would remain at the heart of Lamborghini's cars for decades.",
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
    quote: "L'auto deve essere bella, ma soprattutto deve essere veloce.",
    photoCredit: "Foto: Giotto Bizzarrini nella sua officina — Bizzarrini Heritage",
    legacyKicker: "L'eredità",
    legacyTitle: "Un ingegnere, tre rivoluzioni",
    legacyLead: "Dalla Ferrari 250 GTO alla Bizzarrini 5300 GT, passando per il V12 Lamborghini, Giotto Bizzarrini ha posto le basi meccaniche della moderna GT italiana.",
    stats: [
      { value: "1926", label: "Nascita a Livorno" },
      { value: "1961", label: "Addio alla Ferrari" },
      { value: "1964", label: "Fondazione Bizzarrini S.p.A." },
    ],
    achievementsTitle: "Altre realizzazioni maggiori",
    achievementsFerrari: "Ferrari 250 GTO",
    achievementsLamborghini: "V12 Lamborghini",
    achievementsFerrariDesc:
      "Artefice dello sviluppo della Ferrari 250 GTO a Maranello. Vedi l'opera di riferimento « Ferrari 166 to F50 GT ».",
    achievementsLamborghiniDesc:
      "Progettazione del leggendario motore V12 3,5 litri per il prototipo Lamborghini 350 GTV — un propulsore che rimarrà al cuore delle Lamborghini per decenni.",
  },

};
