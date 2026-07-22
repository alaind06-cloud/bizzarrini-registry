import { createClient } from "@supabase/supabase-js";

// Publishable key — safe to expose in client code.
const SUPABASE_URL = "https://rbrkzrtrlvihpjugksnb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GrhhILemLzDZ-9_ncAjoeg_4HVtSmjP";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const photoUrl = (filename: string | null | undefined) =>
  filename ? `${SUPABASE_URL}/storage/v1/object/public/photos/${filename}` : null;

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
};

export type Profil = {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  statut: "en_attente" | "valide" | "refuse";
  est_admin: boolean;
  created_at?: string;
};
