DROP POLICY IF EXISTS marques_lecture_publique ON public.marques;
CREATE POLICY marques_lecture_publique
ON public.marques FOR SELECT
TO anon, authenticated
USING (actif = true OR (auth.uid() IS NOT NULL AND public.est_admin(auth.uid())));

DROP POLICY IF EXISTS "Catalogue public en lecture" ON public.voitures;
CREATE POLICY "Catalogue public en lecture"
ON public.voitures FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.marques m WHERE m.slug = voitures.marque AND m.actif = true)
  OR (auth.uid() IS NOT NULL AND public.est_admin(auth.uid()))
);