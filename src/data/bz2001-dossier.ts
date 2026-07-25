import type { Lang } from "@/lib/i18n";

/**
 * Dossier de presse d'époque du concept-car Bizzarrini BZ-2001
 * (Bizzarrini / Watkins Racing, 1990-1993).
 * Contenu éditorial statique, propre à ce châssis.
 */
export interface Bz2001Content {
  genesisTitle: string;
  genesisLead: string;
  genesisBody: string[];
  mediaKicker: string;
  mediaNumber: string;
  mediaUnit: string;
  mediaBody: string;
  mediaExamples: string[];
  timeline: Array<{ year: string; text: string }>;
}

export const BZ2001_MODEL = "bz-2001";

export function isBz2001(car: { modele?: string | null; titre?: string | null }): boolean {
  const hay = `${car.modele ?? ""} ${car.titre ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return hay.includes(BZ2001_MODEL);
}

const CONTENT: Record<Lang, Bz2001Content> = {
  fr: {
    genesisTitle: "Genèse du projet",
    genesisLead: "Pebble Beach, 1989 — une Bizzarrini Spider SI, et l'idée d'une héritière moderne.",
    genesisBody: [
      "Le projet naît au concours d'élégance de Pebble Beach en 1989 : devant une Bizzarrini Spider SI, l'équipe de Watkins Racing conçoit l'idée d'une interprétation contemporaine de la marque livournaise, dans l'esprit des GT dessinées trente ans plus tôt.",
      "Une rencontre est organisée avec Giotto Bizzarrini lui-même, qui accorde son nom et son regard d'ingénieur au projet. Le dessin est ensuite mis en volume sous forme d'une maquette en argile grandeur nature, retravaillée jusqu'à trouver la ligne définitive.",
      "La voiture est finalement construite en 1990 sur une base mécanique et de châssis de Ferrari Testarossa, avec son V12 à plat en position centrale arrière — un choix qui place la BZ-2001 dans la lignée directe des Bizzarrini de compétition à moteur central.",
    ],
    mediaKicker: "Couverture médiatique 1991-1994",
    mediaNumber: "30+",
    mediaUnit: "publications automobiles",
    mediaBody:
      "Entre sa présentation et le milieu des années 1990, le concept-car est publié par plus de trente magazines dans une dizaine de pays : États-Unis, Royaume-Uni, Allemagne, Espagne, Japon, Argentine, Hongrie.",
    mediaExamples: ["Road & Track (US)", "Auto Motor und Sport (DE)", "Car Graphic (JP)"],
    timeline: [
      { year: "1990", text: "Conception et construction : maquette en argile grandeur nature, puis réalisation sur base châssis et moteur Ferrari Testarossa." },
      { year: "1993", text: "Présentation officielle du concept-car, notamment lors de la vente Barrett-Jackson." },
      { year: "2017", text: "Vendue en Belgique." },
      { year: "2021", text: "Vendue en Suisse." },
      { year: "2022", text: "Retour en Belgique, collection privée." },
    ],
  },
  en: {
    genesisTitle: "Genesis of the project",
    genesisLead: "Pebble Beach, 1989 — a Bizzarrini Spider SI, and the idea of a modern heir.",
    genesisBody: [
      "The project began at the 1989 Pebble Beach Concours d'Elegance: standing in front of a Bizzarrini Spider SI, the Watkins Racing team conceived a contemporary interpretation of the Livorno marque, in the spirit of the GTs drawn thirty years earlier.",
      "A meeting was arranged with Giotto Bizzarrini himself, who lent both his name and his engineer's eye to the project. The design was then translated into a full-size clay model, reworked until the definitive line was found.",
      "The car was built in 1990 on Ferrari Testarossa chassis and running gear, with its flat V12 in a mid-rear position — a choice that places the BZ-2001 in the direct lineage of the mid-engined competition Bizzarrinis.",
    ],
    mediaKicker: "Press coverage 1991-1994",
    mediaNumber: "30+",
    mediaUnit: "automotive publications",
    mediaBody:
      "Between its unveiling and the mid-1990s, the concept car was featured by more than thirty magazines across some ten countries: United States, United Kingdom, Germany, Spain, Japan, Argentina, Hungary.",
    mediaExamples: ["Road & Track (US)", "Auto Motor und Sport (DE)", "Car Graphic (JP)"],
    timeline: [
      { year: "1990", text: "Design and construction: full-size clay model, then build on Ferrari Testarossa chassis and engine." },
      { year: "1993", text: "Official unveiling of the concept car, notably at the Barrett-Jackson sale." },
      { year: "2017", text: "Sold in Belgium." },
      { year: "2021", text: "Sold in Switzerland." },
      { year: "2022", text: "Returned to Belgium, private collection." },
    ],
  },
  it: {
    genesisTitle: "Genesi del progetto",
    genesisLead: "Pebble Beach, 1989 — una Bizzarrini Spider SI e l'idea di un'erede moderna.",
    genesisBody: [
      "Il progetto nasce al concorso d'eleganza di Pebble Beach nel 1989: davanti a una Bizzarrini Spider SI, il team Watkins Racing immagina un'interpretazione contemporanea del marchio livornese, nello spirito delle GT disegnate trent'anni prima.",
      "Viene organizzato un incontro con Giotto Bizzarrini in persona, che presta il proprio nome e il proprio occhio di ingegnere al progetto. Il disegno viene poi tradotto in un modello in argilla in scala reale, rielaborato fino alla linea definitiva.",
      "L'auto è costruita nel 1990 su telaio e meccanica Ferrari Testarossa, con il V12 piatto in posizione centrale-posteriore — una scelta che colloca la BZ-2001 nella diretta discendenza delle Bizzarrini da competizione a motore centrale.",
    ],
    mediaKicker: "Copertura stampa 1991-1994",
    mediaNumber: "30+",
    mediaUnit: "pubblicazioni automobilistiche",
    mediaBody:
      "Tra la presentazione e la metà degli anni Novanta, la concept car è pubblicata da oltre trenta riviste in una decina di paesi: Stati Uniti, Regno Unito, Germania, Spagna, Giappone, Argentina, Ungheria.",
    mediaExamples: ["Road & Track (US)", "Auto Motor und Sport (DE)", "Car Graphic (JP)"],
    timeline: [
      { year: "1990", text: "Progettazione e costruzione: modello in argilla in scala reale, poi realizzazione su telaio e motore Ferrari Testarossa." },
      { year: "1993", text: "Presentazione ufficiale della concept car, in particolare alla vendita Barrett-Jackson." },
      { year: "2017", text: "Venduta in Belgio." },
      { year: "2021", text: "Venduta in Svizzera." },
      { year: "2022", text: "Ritorno in Belgio, collezione privata." },
    ],
  },
};

export function bz2001Content(lang: Lang): Bz2001Content {
  return CONTENT[lang] ?? CONTENT.en;
}
