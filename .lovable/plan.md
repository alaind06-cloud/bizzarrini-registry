# Diagnostic réel des photos mobiles

## Objectif
Instrumenter le parcours réellement exécuté sur le téléphone, sans modifier Supabase, l’accès membre, les données ni le proxy des couvertures.

## Changements ciblés
- Ajouter `?photoDebug=1` sur les fiches châssis.
- En mode diagnostic uniquement, afficher sous chaque vignette : état (`loading`, `loaded`, `error`, `fallback`), URL demandée, URL finalement choisie par le navigateur (`currentSrc`), dimensions naturelles et affichées.
- En mode diagnostic uniquement, charger les images immédiatement et sans `srcset` afin d’isoler simultanément le lazy-loading et la sélection responsive, tout en affichant l’URL transformée 400 px.
- Ne plus masquer silencieusement une image après l’échec de l’original ; conserver une erreur visible dans le mode diagnostic.
- Hors mode diagnostic, préserver exactement le rendu et le comportement actuels.

## Vérification
- Vérifier le HTML généré et les états image sur une fiche accessible dans l’environnement disponible.
- Tester plusieurs URLs réelles Supabase, originales et transformées.
- Contrôler le résultat sur les largeurs ordinateur et téléphone disponibles.
- Vérifier obligatoirement la compilation finale.

## Limite assumée
Sans accès à la session membre du téléphone concerné, la cause ne sera déclarée corrigée que si la télémétrie du téléphone la démontre. Sinon, le mode diagnostic restera en place pour fournir cette preuve.
