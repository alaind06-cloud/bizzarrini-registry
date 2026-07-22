-- À exécuter UNE FOIS dans le SQL Editor du projet Supabase externe,
-- AVANT de lancer scripts/translate_histories.ts.

alter table public.voiture_details
  add column if not exists description_en text,
  add column if not exists description_fr text,
  add column if not exists description_it text;
