-- Ajoute email + raison de la demande sur les profils
-- À exécuter dans Supabase → SQL Editor

alter table public.profils
  add column if not exists email text,
  add column if not exists raison text;

-- Backfill des emails existants depuis auth.users
update public.profils p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Le trigger d'inscription recopie email + raison depuis les métadonnées
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profils (id, nom, prenom, telephone, email, raison, statut)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nom', ''),
    nullif(new.raw_user_meta_data ->> 'prenom', ''),
    nullif(new.raw_user_meta_data ->> 'telephone', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'raison', ''),
    'en_attente'
  )
  on conflict (id) do update
    set nom = coalesce(excluded.nom, public.profils.nom),
        prenom = coalesce(excluded.prenom, public.profils.prenom),
        telephone = coalesce(excluded.telephone, public.profils.telephone),
        email = coalesce(excluded.email, public.profils.email),
        raison = coalesce(excluded.raison, public.profils.raison);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
