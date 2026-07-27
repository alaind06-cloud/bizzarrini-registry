import { createClient } from "@supabase/supabase-js";

// Les variables sont lues de façon fiable dans les deux contextes :
// - client : import.meta.env.VITE_* (remplacé au build par Vite)
// - serveur (SSR Nitro/Vercel/Cloudflare) : process.env.* si le remplacement n'a pas eu lieu
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

const SUPABASE_URL = pick("VITE_SUPABASE_URL", "SUPABASE_URL");
const SUPABASE_ANON_KEY = pick(
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  // Ne jamais throw au chargement du module : cela casserait tout le rendu SSR
  // (page blanche / 500) alors que seules les requêtes Supabase devraient échouer.
  console.error(
    "Supabase non configuré : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans vos variables d'environnement.",
  );
}

export const supabase = createClient(
  SUPABASE_URL ?? "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const photoUrl = (filename: string | null | undefined) =>
  filename && SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/Bizzarrini%20Photos/photos_flat/${filename}`
    : null;



export type Voiture = {
  id: string;
  titre: string;
  modele: string | null;
  annee: number | null;
  chassis: string | null;
  cover_photo: string | null;
  photo_prefix: string | null;
};

export type Photo = {
  id: string;
  voiture_id: string;
  filename: string;
  ordre: number | null;
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
