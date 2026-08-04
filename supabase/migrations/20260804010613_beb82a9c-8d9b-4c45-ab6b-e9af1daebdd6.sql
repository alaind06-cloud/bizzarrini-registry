-- La lecture publique des photos passe par le bucket public (URL /object/public),
-- qui ne dépend pas des policies RLS. La policy RLS anon n'est donc pas nécessaire
-- et forçait un GRANT EXECUTE à anon sur une fonction SECURITY DEFINER.
DROP POLICY IF EXISTS "photos_bucket_read_marque_active" ON storage.objects;

CREATE POLICY "photos_bucket_read_marque_active"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'photos' AND public.photo_storage_publique(name));

REVOKE EXECUTE ON FUNCTION public.photo_storage_publique(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.photo_storage_publique(text) FROM PUBLIC;