/**
 * Nettoyage et uniformisation des numéros de châssis.
 *
 * La base contient des valeurs bruitées où le numéro de châssis est mélangé à
 * un numéro de moteur ou à une donnée annexe (« 741373 BA4 0201 »,
 * « IA3 0280 Replica »). On sépare ici :
 *  - `chassis`      : le numéro de châssis pur, au format uniforme (BA4 0110) ;
 *  - `engineNumber` : le numéro de moteur, affiché dans le bloc Spécifications ;
 *  - `note`         : toute autre mention annexe (Replica, Prototipo, …).
 *
 * IMPORTANT : ce nettoyage est purement *d'affichage*. Les slugs d'URL
 * continuent d'être calculés sur la valeur brute, afin de ne casser ni les
 * liens existants ni l'unicité des adresses.
 */

export type CleanChassis = {
  chassis: string;
  engineNumber?: string;
  note?: string;
};

/** Cas particuliers relevés dans les archives (clé = valeur brute en base). */
const OVERRIDES: Record<string, CleanChassis> = {
  "B-0222 - IA30222": { chassis: "B-0222", note: "IA3 0222" },
  "1495686 - IA3 0318": { chassis: "IA3 0318", engineNumber: "1495686" },
  "741373 BA4 0201": { chassis: "BA4 0201", engineNumber: "741373" },
  "IA3 0280 Replica": { chassis: "IA3 0280", note: "Replica" },
  "B150-0521 Prototipo": { chassis: "B150-0521", note: "Prototipo" },
  "2 3632": { chassis: "2", engineNumber: "3632" },
  "4 3634": { chassis: "4", engineNumber: "3634" },
  "6 - Bizzarrini Sciabola 01": { chassis: "6", note: "Bizzarrini Sciabola 01" },
};

const pad4 = (digits: string) => (digits.length < 4 ? digits.padStart(4, "0") : digits);

/** Uniformise « BA4 110 » → « BA4 0110 », « IA3-0260 » → « IA3 0260 ». */
function normalize(raw: string): string {
  const c = raw.trim().replace(/\s+/g, " ");
  const m = c.match(/^(IA3|BA4|B150|B)\s*-?\s*(\d{1,5})(\s*[A-Z].*)?$/i);
  if (!m) return c;
  const prefix = m[1].toUpperCase();
  const digits = m[2];
  const suffix = (m[3] ?? "").trim();
  const sep = prefix === "B" || prefix === "B150" ? "-" : " ";
  return [`${prefix}${sep}${pad4(digits)}`, suffix].filter(Boolean).join(" ");
}

const cache = new Map<string, CleanChassis>();

/** Analyse une valeur brute de châssis et sépare châssis / moteur / annexe. */
export function cleanChassis(raw: string | null | undefined): CleanChassis {
  const value = (raw ?? "").trim();
  if (!value) return { chassis: "" };
  const hit = cache.get(value);
  if (hit) return hit;
  const override = OVERRIDES[value];
  const result: CleanChassis = override
    ? { ...override, chassis: normalize(override.chassis) }
    : { chassis: normalize(value) };
  cache.set(value, result);
  return result;
}

/** Numéro de châssis pur, prêt à l'affichage. */
export function displayChassis(raw: string | null | undefined): string {
  return cleanChassis(raw).chassis;
}

/** Numéro de moteur extrait du champ châssis, s'il y en avait un. */
export function chassisEngineNumber(raw: string | null | undefined): string | undefined {
  return cleanChassis(raw).engineNumber;
}

/** Vrai si la recherche libre correspond au châssis (brut ou nettoyé). */
export function matchesChassis(raw: string | null | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const { chassis, engineNumber, note } = cleanChassis(raw);
  const hay = [raw ?? "", chassis, engineNumber ?? "", note ?? ""].join(" ").toLowerCase();
  // « BA4 110 » doit aussi trouver « BA4 0110 » : on compare sans zéros ni séparateurs.
  const loose = (s: string) => s.replace(/[\s-]/g, "").replace(/(?<=[a-z])0+/g, "");
  return hay.includes(q) || loose(hay).includes(loose(q));
}
