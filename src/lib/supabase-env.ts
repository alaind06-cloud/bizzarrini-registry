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

const PHOTO_PATH = "Bizzarrini%20Photos/photos_flat";

/**
 * URL d'une photo. Si `width` est fourni, on passe par le service de
 * transformation d'images (redimensionnement + WebP négocié) : bien plus léger
 * sur mobile que le fichier original.
 */
export const photoUrl = (
  filename: string | null | undefined,
  opts?: { width?: number; quality?: number },
) => {
  if (!filename || !SUPABASE_URL) return null;
  if (!opts?.width) return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_PATH}/${filename}`;
  const q = opts.quality ?? 70;
  return `${SUPABASE_URL}/storage/v1/render/image/public/${PHOTO_PATH}/${filename}?width=${opts.width}&quality=${q}&resize=contain`;
};

export type Voiture = {
  id: string;
  titre: string;
  modele: string | null;
  annee: number | null;
  chassis: string | null;
  cover_photo: string | null;
  photo_prefix: string | null;
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
