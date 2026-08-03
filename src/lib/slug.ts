/** Slug helpers partagés (aucune dépendance lourde : sûr pour le bundle initial). */

export function chassisToSlug(chassis: string | null | undefined): string {
  if (!chassis) return "";
  return chassis
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug utilisé dans les URLs : le châssis si disponible, sinon le titre. */
export function carSlug(car: { chassis?: string | null; titre?: string | null }): string {
  return chassisToSlug(car.chassis) || chassisToSlug(car.titre);
}
