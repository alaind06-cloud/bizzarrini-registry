-- 1. PROFILS : empêcher l'auto-promotion admin
drop policy if exists "profil self ou admin update" on public.profils;
create policy "profil self ou admin update"
  on public.profils for update to authenticated
  using ((id = auth.uid()) or public.est_admin(auth.uid()))
  with check ((id = auth.uid()) or public.est_admin(auth.uid()));

create or replace function public.proteger_champs_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin(auth.uid()) then
    new.est_admin := old.est_admin;
    new.statut := old.statut;
    new.marque := old.marque;
  end if;
  return new;
end;
$$;
revoke all on function public.proteger_champs_profil() from public, anon, authenticated;

drop trigger if exists trg_proteger_champs_profil on public.profils;
create trigger trg_proteger_champs_profil
  before update on public.profils
  for each row execute function public.proteger_champs_profil();

-- 2/3. Lecture publique des photos et descriptions, limitée aux marques publiées
create policy "photos_lecture_publique_marque_active"
  on public.photos for select to anon, authenticated
  using (exists (
    select 1 from public.voitures v
    join public.marques m on m.slug = v.marque
    where v.id = photos.voiture_id and m.actif = true
  ));

create policy "voiture_details_lecture_publique_marque_active"
  on public.voiture_details for select to anon, authenticated
  using (exists (
    select 1 from public.voitures v
    join public.marques m on m.slug = v.marque
    where v.id = voiture_details.voiture_id and m.actif = true
  ));

-- 4. Storage : lecture API restreinte aux fichiers d'une marque publiée (bloque le listing global)
create or replace function public.photo_storage_publique(_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.photos ph
    join public.voitures v on v.id = ph.voiture_id
    join public.marques m on m.slug = v.marque
    where m.actif = true
      and ph.filename = split_part(_name, '/', array_length(string_to_array(_name, '/'), 1))
  )
$$;
revoke all on function public.photo_storage_publique(text) from public;
grant execute on function public.photo_storage_publique(text) to anon, authenticated, service_role;

drop policy if exists "photos_bucket_public_read" on storage.objects;
create policy "photos_bucket_read_marque_active"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'photos' and public.photo_storage_publique(name));

create policy "photos_bucket_admin_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.est_admin(auth.uid()));

-- 6. Fonction SECURITY DEFINER inutilisée : plus exécutable par les utilisateurs connectés
revoke execute on function public.est_valide(uuid) from authenticated;