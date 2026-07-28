import { supabase } from "@/lib/supabase";

/** Emplacement des photos du registre dans le stockage. */
export const PHOTO_BUCKET = "Bizzarrini Photos";
export const PHOTO_FOLDER = "photos_flat";

const path = (filename: string) => `${PHOTO_FOLDER}/${filename}`;

/** Envoie un fichier dans le stockage (sans écraser un fichier existant). */
export async function uploadPhoto(filename: string, blob: Blob) {
  return supabase.storage.from(PHOTO_BUCKET).upload(path(filename), blob, {
    contentType: "image/jpeg",
    upsert: false,
    cacheControl: "31536000",
  });
}

/** Remplace le contenu d'une photo existante (retouche). */
export async function replacePhoto(filename: string, blob: Blob) {
  return supabase.storage.from(PHOTO_BUCKET).upload(path(filename), blob, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "31536000",
  });
}

/**
 * Marque une photo comme retouchée (ou non) — colonne `photos.retouchee`.
 * Si la migration n'a pas encore été exécutée, l'erreur est signalée pour que
 * l'interface puisse l'afficher sans bloquer le reste.
 */
export async function setPhotoRetouched(photoId: string, value: boolean) {
  const { error } = await supabase.from("photos").update({ retouchee: value }).eq("id", photoId);
  return { error, missingColumn: Boolean(error && /retouchee/i.test(error.message)) };
}

/**
 * Renomme une photo : déplace le fichier dans le stockage puis met à jour la
 * référence en base (table `photos`, et `voitures.cover_photo` si besoin).
 */
export async function renamePhoto(opts: {
  photoId: string;
  voitureId: string;
  from: string;
  to: string;
  isCover: boolean;
}) {
  const { photoId, voitureId, from, to, isCover } = opts;
  if (from === to) return { error: null as { message: string } | null };

  const moved = await supabase.storage.from(PHOTO_BUCKET).move(path(from), path(to));
  if (moved.error) return { error: moved.error };

  const updated = await supabase.from("photos").update({ filename: to }).eq("id", photoId);
  if (updated.error) {
    // On remet le fichier à sa place pour ne pas casser la fiche.
    await supabase.storage.from(PHOTO_BUCKET).move(path(to), path(from));
    return { error: updated.error };
  }

  if (isCover) {
    const cov = await supabase.from("voitures").update({ cover_photo: to }).eq("id", voitureId);
    if (cov.error) return { error: cov.error };
  }
  return { error: null };
}
