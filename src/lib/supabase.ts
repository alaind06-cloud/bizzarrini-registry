import { createClient } from "@supabase/supabase-js";

// Configuration via variables d'environnement Vite (voir .env.example).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase non configuré : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans vos variables d'environnement.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const photoUrl = (filename: string | null | undefined) =>
  filename ? `${SUPABASE_URL}/storage/v1/object/public/Bizzarrini%20Photos/photos_flat/${filename}` : null;


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
  statut: "en_attente" | "valide" | "refuse";
  est_admin: boolean;
  created_at?: string;
};
