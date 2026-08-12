/** Domaine de production canonique du site. */
export const SITE_URL = "https://www.registerbizzarrini.com";

/** Base hôte des sitemaps : domaine de production canonique. */
export const SITEMAP_BASE = SITE_URL;

/** Construit une URL absolue canonique à partir d'un chemin (`/`, `/books`, ...). */
export function canonical(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
