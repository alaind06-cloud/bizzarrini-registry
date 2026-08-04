-- 1) Storage: bucket "photos"
DROP POLICY IF EXISTS "photos_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "photos_bucket_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "photos_bucket_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "photos_bucket_admin_delete" ON storage.objects;

CREATE POLICY "photos_bucket_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'photos');

CREATE POLICY "photos_bucket_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND public.est_admin(auth.uid()));

CREATE POLICY "photos_bucket_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos' AND public.est_admin(auth.uid()))
WITH CHECK (bucket_id = 'photos' AND public.est_admin(auth.uid()));

CREATE POLICY "photos_bucket_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND public.est_admin(auth.uid()));

-- 2) Marques : lecture publique limitée aux marques actives
DROP POLICY IF EXISTS marques_lecture_publique ON public.marques;
CREATE POLICY marques_lecture_publique
ON public.marques FOR SELECT
TO anon, authenticated
USING (actif = true OR public.est_admin(auth.uid()));

-- 3) Voitures : lecture publique limitée aux marques actives
DROP POLICY IF EXISTS "Catalogue public en lecture" ON public.voitures;
CREATE POLICY "Catalogue public en lecture"
ON public.voitures FOR SELECT
TO anon, authenticated
USING (
  public.est_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.marques m WHERE m.slug = voitures.marque AND m.actif = true)
);

-- 4) SECURITY DEFINER : limiter l'exécution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sauvegarder_historique_voiture_details() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.est_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.est_valide(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.est_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.est_valide(uuid) TO authenticated, service_role;