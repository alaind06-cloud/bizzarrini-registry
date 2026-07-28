-- Statut de traitement des photos (recadrage / retouche).
-- À exécuter une fois dans l'éditeur SQL Supabase.
--
-- `retouchee = false` : photo importée avec le recadrage automatique, en
-- attente de validation manuelle depuis /admin (outil ✂).
-- `retouchee = true`  : photo recadrée / ajustée et validée.
-- La colonne est lisible et modifiable directement en base (traitement de
-- masse par script) comme depuis l'interface admin.

alter table public.photos
  add column if not exists retouchee boolean not null default false;

create index if not exists photos_retouchee_idx on public.photos (voiture_id, retouchee);

-- Mise à jour du statut depuis l'admin
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'photos' and policyname = 'admins update photos rows'
  ) then
    create policy "admins update photos rows"
      on public.photos for update to authenticated
      using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin))
      with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));
  end if;
end $$;
