import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./supabase-env";

export * from "./supabase-env";

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
