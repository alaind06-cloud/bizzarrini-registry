# Roadmap

- [x] Mode diagnostic photo `?photoDebug=1` sur les fiches châssis
- [x] Cause 4G isolée : les fiches chargeaient les photos en direct depuis Supabase (variante 2x 800 px, cache court, transformations à froid), alors que l'accueil passe par le relais même-origine à cache d'un an
- [x] Fiches châssis : vignettes et photo principale servies par `/api/public/cover`, densité 2x supprimée sur les vignettes
- [ ] Confirmer sur téléphone réel en 4G après publication, puis retirer le mode `?photoDebug=1`
