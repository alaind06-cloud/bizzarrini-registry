-- À exécuter dans le SQL editor du projet Supabase externe.

create table if not exists public.validation_tokens (
  token uuid primary key default gen_random_uuid(),
  profil_id uuid references public.profils(id) on delete cascade,
  utilise boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

grant select, insert, update on public.validation_tokens to service_role;

alter table public.validation_tokens enable row level security;

-- Aucune politique publique: seul le service_role (côté serveur) accède à cette table.
