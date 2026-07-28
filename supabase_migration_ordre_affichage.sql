-- Ordre d'affichage manuel des châssis dans le registre.
-- À exécuter une fois dans l'éditeur SQL Supabase.
alter table public.voitures
  add column if not exists ordre_affichage integer;

create index if not exists voitures_ordre_affichage_idx
  on public.voitures (ordre_affichage);
