/**
 * Partie légère de l'intégration Supabase : variables d'environnement, URLs de
 * photos et types. Ce module ne charge PAS le SDK `@supabase/supabase-js`, ce
 * qui permet de le garder hors du bundle JS initial.
 */

const viteEnv = (import.meta.env ?? {}) as Record<string, string | undefined>;
const nodeEnv: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env ? (process.env as Record<string, string | undefined>) : {};

const pick = (...names: string[]) => {
  for (const name of names) {
    const value = viteEnv[name] ?? nodeEnv[name];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
};

export const SUPABASE_URL = pick("VITE_SUPABASE_URL", "SUPABASE_URL");
export const SUPABASE_ANON_KEY = pick(
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Marque propre à ce site : registerbizzarrini.com n'expose que les Bizzarrini.
 * Ce filtre applicatif s'ajoute (et ne se substitue pas) aux policies RLS
 * qui masquent déjà les marques non publiées.
 */
export const SITE_MARQUE = "bizzarrini";

/** Dossier par défaut des photos (fiches sans `storage_path` renseigné). */
const PHOTO_PATH = "bizzarrini";

/**
 * Les photos du registre sont hébergées sur le bucket public Supabase Storage
 * `voitures-photos`. Surchargeable via `VITE_SUPABASE_PHOTOS_URL`.
 */
export const PHOTOS_BASE_URL =
  pick("VITE_SUPABASE_PHOTOS_URL", "SUPABASE_PHOTOS_URL") ??
  "https://darckkyqmzningzzbkhr.supabase.co/storage/v1/object/public/voitures-photos";

/**
 * URL publique d'une photo. Les fichiers sont rangés par châssis :
 * `PHOTOS_BASE_URL / voitures.storage_path / photos.filename`.
 * `path` correspond à `voiture.storage_path` (ex. `bizzarrini/1964-iso-grifo-.../`).
 */
export const photoUrl = (
  filename: string | null | undefined,
  opts?: { width?: number; quality?: number; path?: string | null },
) => {
  if (!filename) return null;
  const raw = (opts?.path ?? PHOTO_PATH).trim().replace(/^\/+|\/+$/g, "");
  const folder = raw.length ? raw : PHOTO_PATH;
  const encoded = folder
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${PHOTOS_BASE_URL}/${encoded}/${encodeURIComponent(filename)}`;
};



export type Voiture = {
  id: string;
  titre: string;
  modele: string | null;
  annee: number | null;
  chassis: string | null;
  cover_photo: string | null;
  photo_prefix: string | null;
  /** Dossier des photos dans le bucket (ex. `bizzarrini/1964-iso-grifo-a3-c-b-0208/`). */
  storage_path?: string | null;

  /** Ordre manuel du registre, défini depuis /admin (peut être absent). */
  ordre_affichage?: number | null;
};

export type Photo = {
  id: string;
  voiture_id: string;
  filename: string;
  ordre: number | null;
  /** Statut de traitement : true si la photo a été recadrée/ajustée et validée. */
  retouchee?: boolean | null;
};

export type VoitureDetail = {
  voiture_id: string;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  description_it: string | null;
};

export type Profil = {
  id: string;
  marque?: string | null;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  email?: string | null;
  raison?: string | null;
  statut: "en_attente" | "valide" | "refuse";
  est_admin: boolean;
  created_at?: string;
};

/**
 * Charge le SDK Supabase à la demande (chunk séparé, hors bundle initial).
 * À utiliser dans les effets / handlers, jamais au niveau module d'une route
 * rendue au premier écran.
 */
export const getSupabase = async () => (await import("./supabase")).supabase;
