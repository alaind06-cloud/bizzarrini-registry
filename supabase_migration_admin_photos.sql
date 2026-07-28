-- Droits nécessaires à l'ajout / la retouche de photos depuis /admin.
-- À exécuter une fois dans l'éditeur SQL Supabase.
--
-- Le stockage n'autorise par défaut que la lecture publique : sans ces
-- politiques, l'envoi d'une photo échoue avec « new row violates row-level
-- security policy ».

-- Envoi de nouvelles photos
create policy "admins upload photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'Bizzarrini Photos'
    and exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin)
  );

-- Retouche (remplacement) et renommage
create policy "admins update photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'Bizzarrini Photos'
    and exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin)
  );

create policy "admins delete photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'Bizzarrini Photos'
    and exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin)
  );

-- Création d'une fiche châssis et de sa galerie
create policy "admins insert voitures"
  on public.voitures for insert to authenticated
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

create policy "admins insert photos rows"
  on public.photos for insert to authenticated
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

create policy "admins insert voiture_details"
  on public.voiture_details for insert to authenticated
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));
