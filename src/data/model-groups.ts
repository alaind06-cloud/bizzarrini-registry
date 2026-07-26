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

export type RegistryFilters = {
  /** clé de groupe de modèle (pills) */
  g?: string;
  /** recherche libre sur le modèle (paramètre historique) */
  m?: string;
  /** décennie, ex "1960" */
  d?: string;
  /** recherche sur le numéro de châssis */
  q?: string;
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
