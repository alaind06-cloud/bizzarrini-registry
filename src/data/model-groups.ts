export type ModelGroup = { key: string; label: string; test: (m: string) => boolean };

/** Groupes de modèles utilisés par les filtres du registre (partagés registre ⇄ fiche châssis). */
export const MODEL_GROUPS: ModelGroup[] = [
  { key: "iso-grifo-a3c", label: "Iso Grifo A3/C", test: (m) => /iso\s*grifo.*a3\s*\/?\s*c/i.test(m) || /^a3\/?c/i.test(m) },
  { key: "iso-grifo-a3l", label: "Iso Grifo A3/L", test: (m) => /iso\s*grifo.*a3\s*\/?\s*l/i.test(m) || /^a3\/?l/i.test(m) },
  { key: "iso-grifo", label: "Iso Grifo", test: (m) => /iso\s*grifo/i.test(m) },
  { key: "5300-gt", label: "5300 GT", test: (m) => /5300\s*gt/i.test(m) },
  { key: "america", label: "America", test: (m) => /\bamerica\b/i.test(m) },
  { key: "europa", label: "Europa", test: (m) => /\beuropa\b/i.test(m) },
  { key: "p538", label: "P538", test: (m) => /p\s*538/i.test(m) },
  { key: "amx3", label: "AMX/3", test: (m) => /amx\s*\/?\s*3/i.test(m) },
  { key: "1900", label: "1900", test: (m) => /\b1900\b/i.test(m) },
  { key: "manta", label: "Manta", test: (m) => /\bmanta\b/i.test(m) },
  { key: "gt-strada", label: "GT Strada", test: (m) => /gt\s*strada/i.test(m) },
  { key: "bz2000", label: "BZ 2000", test: (m) => /bz\s*2000|barchetta/i.test(m) },
];

/** Familles qui constituent une série à part entière, quel que soit le préfixe de châssis. */
const DISTINCT_FAMILIES = new Set(["1900", "manta", "amx3", "p538", "bz2000", "europa"]);

/** Repère l'entrée d'ouverture du registre (Fiat Topolino, « the first car »). */
export function isFirstCar(v: { titre?: string | null; modele?: string | null }): boolean {
  const s = `${v.titre ?? ""} ${v.modele ?? ""}`.toLowerCase();
  return /topolino|first car/.test(s);
}

/**
 * Analyse un numéro de châssis bruité (« B-0222 - IA30222 », « 741373 BA4 0201 »,
 * « IA3 0280 Replica ») et renvoie le préfixe de série + le numéro.
 */
function parseChassis(chassis?: string | null): { prefix: string; num: number } {
  const c = (chassis ?? "").trim().toUpperCase();
  if (!c) return { prefix: "", num: Number.MAX_SAFE_INTEGER };
  const m = c.match(/\b([A-Z]{2,3}\d)\s*-?\s*(\d{2,5})\b/) ?? c.match(/\b([A-Z]{1,3})\s*-?\s*(\d{2,5})\b/);
  if (m) return { prefix: m[1], num: parseInt(m[2], 10) };
  const n = c.match(/\d{1,6}/);
  return { prefix: "", num: n ? parseInt(n[0], 10) : Number.MAX_SAFE_INTEGER };
}

/** Extrait le préfixe de série d'un numéro de châssis (ex: "B-0201" -> "B", "IA3 0226" -> "IA3"). */
export function chassisPrefix(chassis?: string | null): string {
  return parseChassis(chassis).prefix;
}

/** Partie numérique du châssis, pour un tri numérique. */
export function chassisNumber(chassis?: string | null): number {
  return parseChassis(chassis).num;
}

type SortableCar = {
  titre?: string | null;
  modele?: string | null;
  annee?: number | string | null;
  chassis?: string | null;
  id?: number | string;
};

/** Clé de série : famille distincte si applicable, sinon préfixe de châssis. */
function seriesKey(v: SortableCar): string {
  if (isFirstCar(v)) return "\u0000first";
  const model = v.modele ?? "";
  const fam = MODEL_GROUPS.find((g) => DISTINCT_FAMILIES.has(g.key) && model && g.test(model));
  if (fam) return `fam:${fam.key}`;
  const p = chassisPrefix(v.chassis);
  return p ? `ch:${p}` : "zz:";
}

const yearOf = (v: SortableCar): number => {
  const y = typeof v.annee === "string" ? parseInt(v.annee, 10) : v.annee;
  return typeof y === "number" && Number.isFinite(y) ? y : Number.MAX_SAFE_INTEGER;
};

/**
 * Trie les voitures par série (famille ou préfixe de châssis), les séries étant
 * ordonnées selon l'année de production la plus ancienne rencontrée (calculée
 * dynamiquement). À l'intérieur d'une série : tri numérique du châssis.
 */
export function sortCars<T extends SortableCar>(cars: T[]): T[] {
  const earliest = new Map<string, number>();
  for (const v of cars) {
    const k = seriesKey(v);
    const y = yearOf(v);
    const cur = earliest.get(k);
    if (cur === undefined || y < cur) earliest.set(k, y);
  }
  return [...cars].sort((a, b) => {
    const ka = seriesKey(a);
    const kb = seriesKey(b);
    if (ka !== kb) {
      if (ka === "\u0000first") return -1;
      if (kb === "\u0000first") return 1;
      const ya = earliest.get(ka) ?? Number.MAX_SAFE_INTEGER;
      const yb = earliest.get(kb) ?? Number.MAX_SAFE_INTEGER;
      if (ya !== yb) return ya - yb;
      if (ka === "zz:") return 1;
      if (kb === "zz:") return -1;
      return ka.localeCompare(kb);
    }
    const na = chassisNumber(a.chassis);
    const nb = chassisNumber(b.chassis);
    if (na !== nb) return na - nb;
    const ya = yearOf(a);
    const yb = yearOf(b);
    if (ya !== yb) return ya - yb;
    return String(a.chassis ?? a.modele ?? "").localeCompare(String(b.chassis ?? b.modele ?? ""));
  });
}


export type RegistryFilters = {
  /** clé de groupe de modèle (pills) */
  g?: string;
  /** recherche libre sur le modèle (paramètre historique) */
  m?: string;
  /** décennie, ex "1960" */
  d?: string;
  /** recherche sur le numéro de châssis */
  q?: string;
  /** page courante du registre (pagination) */
  p?: number;

};

export function hasFilters(f: RegistryFilters): boolean {
  return !!(f.g || f.m || f.d || f.q);
}

/** Applique les filtres du registre à une liste de voitures (même logique que la home). */
export function filterCars<T extends { modele?: string | null; annee?: number | null; chassis?: string | null }>(
  cars: T[],
  f: RegistryFilters,
): T[] {
  const group = f.g ? MODEL_GROUPS.find((x) => x.key === f.g) : undefined;
  const mq = f.m?.toLowerCase() ?? "";
  const q = (f.q ?? "").trim().toLowerCase();
  return cars.filter((v) => {
    if (group && !(v.modele && group.test(v.modele))) return false;
    if (mq && !(v.modele ?? "").toLowerCase().includes(mq)) return false;
    if (f.d) {
      const dec = parseInt(f.d, 10);
      if (!v.annee || v.annee < dec || v.annee >= dec + 10) return false;
    }
    if (q && !(v.chassis ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
}
