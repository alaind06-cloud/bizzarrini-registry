/**
 * Données techniques relevées dans les archives (cartes grises, fiches
 * d'homologation, dossiers de presse) et rattachées à un châssis.
 *
 * Pour ajouter un châssis : ajoutez une entrée ci-dessous. Les clés acceptées
 * sont celles de `ArchiveSpecKey`. Un champ absent n'est simplement pas affiché.
 * Pour un nouveau type de champ : ajoutez la clé dans `ARCHIVE_SPEC_KEYS`
 * (src/routes/chassis.$slug.tsx utilise l'ordre d'affichage) puis son libellé
 * traduit `car.specs.<clé>` dans src/lib/i18n.tsx.
 */

export type ArchiveSpecKey =
  | "engine"
  | "engineNumber"
  | "power"
  | "displacement"
  | "gearbox"
  | "gearboxNumber"
  | "bodywork"
  | "coachbuilder"
  | "color"
  | "interior"
  | "seats"
  | "registration"
  | "condition"
  | "notes";

export type ArchiveSpecs = Partial<Record<ArchiveSpecKey, string>>;

/** Normalise un n° de châssis ou un slug pour la comparaison. */
export function normalizeChassisKey(value: string | null | undefined): string {
  if (!value) return "";
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Clés = n° de châssis (ou identifiant de fiche) normalisés.
 * Un même relevé peut couvrir plusieurs châssis : répétez-le sous chaque clé.
 */
const ARCHIVE_SPECS: Record<string, ArchiveSpecs> = {
  "b-0232": {
    engineNumber: "Corvette n°876 FO 309RE",
    power: "330 ch / 5400 tr/min",
    displacement: "5354 cm³",
    bodywork: "Sports Car Modena (fermée)",
    seats: "2",
  },
  "b-0219": {
    registration: 'Suisse "B10 219"',
    notes: "Quittance douane 31/10/1966",
  },
  "ia3-0340": {
    registration: "302 CL 92",
    notes: "1ère mise en circulation 15.05.1968",
  },
  "b-0213": {
    displacement: "~5354 cm³ (illisible)",
    notes: "Fiche technique Auto-Supermarket Düsseldorf",
  },
  "b-0221": {
    displacement: "~5354 cm³ (illisible)",
    notes: "Fiche technique Auto-Supermarket Düsseldorf",
  },
  "b-0509": {
    seats: "2",
    notes: "Carte PRA Firenze, dossier n°969886, année 1970",
  },
  "b-505": {
    power: "Fiscale 19 CV / Réelle 110 CV à 5400 tr/min",
    displacement: "1897 cm³ (4 cyl.)",
    bodywork: "Chiusa (coupé fermé)",
    seats: "2",
    registration: "LT159433 (11.5.1974), ex-LT371495/1GR106832, ex-82510 GR",
    notes:
      "Poids 1060 kg ; dossier G139037 ; carte de circulation 5.12.71 ; certificat d'origine 6.12.71",
  },
  "b-504": {
    registration: "Fahrzeugbrief allemand n°TH22273",
    notes: "Reste illisible",
  },
  "p538-004": {
    registration: "France 88 TC",
    notes: "Dossier n°069382 (04/04/1989 et 15/05/1989)",
  },
  "ia3-0271": {
    registration: "Mantova MN (24/05/1976)",
    notes: 'Cohérent avec vente "Forrasari MN 230037"',
  },
  "bz-2001": {
    power: "500-700 ch (V8 427 ci³, sources divergentes)",
    displacement: "~7000 cm³ (427 ci³)",
    bodywork: "Carbone/composite roadster",
    seats: "2",
    notes:
      "Coût de construction > 3,5 M$ ; base Ferrari Testarossa 1990 ; série de 25 prévue",
  },
};

/**
 * Retourne les données d'archives pour un châssis, en essayant plusieurs
 * identifiants (n° de châssis, slug d'URL, titre).
 */
export function archiveSpecs(...candidates: Array<string | null | undefined>): ArchiveSpecs {
  for (const candidate of candidates) {
    const key = normalizeChassisKey(candidate);
    if (!key) continue;
    if (ARCHIVE_SPECS[key]) return ARCHIVE_SPECS[key];
    // Tolère les suffixes de slug ("p538-004-lavost", "1990-bz-2001").
    const partial = Object.keys(ARCHIVE_SPECS).find(
      (k) => key === k || key.startsWith(`${k}-`) || key.endsWith(`-${k}`),
    );
    if (partial) return ARCHIVE_SPECS[partial];
  }
  return {};
}
