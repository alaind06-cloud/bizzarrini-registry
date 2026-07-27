/** Domaine de production canonique du site. */
export const SITE_URL = "https://www.registerbizzarrini.com";

/** Construit une URL absolue canonique à partir d'un chemin (`/`, `/books`, ...). */
export function canonical(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
