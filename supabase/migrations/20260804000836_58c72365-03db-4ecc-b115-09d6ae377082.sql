DROP POLICY IF EXISTS marques_lecture_publique ON public.marques;
DROP POLICY IF EXISTS marques_lecture_admin ON public.marques;
CREATE POLICY marques_lecture_publique
ON public.marques FOR SELECT
TO anon, authenticated
USING (actif = true);
CREATE POLICY marques_lecture_admin
ON public.marques FOR SELECT
TO authenticated
USING (public.est_admin(auth.uid()));

DROP POLICY IF EXISTS "Catalogue public en lecture" ON public.voitures;
DROP POLICY IF EXISTS "Catalogue admin en lecture" ON public.voitures;
CREATE POLICY "Catalogue public en lecture"
ON public.voitures FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.marques m WHERE m.slug = voitures.marque AND m.actif = true));
CREATE POLICY "Catalogue admin en lecture"
ON public.voitures FOR SELECT
TO authenticated
USING (public.est_admin(auth.uid()));