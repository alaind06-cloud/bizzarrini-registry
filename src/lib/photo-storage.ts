import { supabase } from "@/lib/supabase";

/**
 * Écriture des photos du registre : bucket Supabase Storage public
 * `voitures-photos`, dossier `voitures.storage_path` (ex.
 * `bizzarrini/America/america-ba4-111/`), même nom de fichier que
 * `photos.filename`. La lecture reste assurée par `photoUrl()` / `coverUrl()`
 * sur ce même bucket.
 */

export const PHOTO_BUCKET = "voitures-photos";
export const PHOTO_FOLDER = "bizzarrini";

const ENDPOINT = "/api/admin-photos";

type Err = { message: string } | null;

/** Normalise un `storage_path` (sans slash de début/fin). */
export const photoFolder = (path?: string | null) => {
  const value = (path ?? "").trim().replace(/^\/+|\/+$/g, "");
  return value.length ? value : PHOTO_FOLDER;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call(init: RequestInit): Promise<{ error: Err }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      ...init,
      headers: { ...(init.headers as Record<string, string>), ...(await authHeaders()) },
    });
    if (res.ok) return { error: null };
    const body = (await res.json().catch(() => null)) as { reason?: string } | null;
    return { error: { message: body?.reason ?? `Erreur ${res.status}` } };
  } catch (e) {
    return { error: { message: (e as Error).message } };
  }
}

/** Envoie un fichier dans le bucket (sans écraser un fichier existant). */
export async function uploadPhoto(filename: string, blob: Blob, path?: string | null) {
  return call({
    body: blob,
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "x-photo-filename": filename,
      "x-photo-path": photoFolder(path),
      "x-photo-op": "upload",
    },
  });
}

/** Remplace le contenu d'une photo existante (retouche). */
export async function replacePhoto(filename: string, blob: Blob, path?: string | null) {
  return call({
    body: blob,
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "x-photo-filename": filename,
      "x-photo-path": photoFolder(path),
      "x-photo-op": "replace",
    },
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
 * Renomme une photo : déplace le fichier dans le bucket puis met à jour la
 * référence en base (table `photos`, et `voitures.cover_photo` si besoin).
 */
export async function renamePhoto(opts: {
  photoId: string;
  voitureId: string;
  from: string;
  to: string;
  isCover: boolean;
  path?: string | null;
}) {
  const { photoId, voitureId, from, to, isCover, path } = opts;
  if (from === to) return { error: null as Err };
  const folder = photoFolder(path);

  const moved = await call({
    body: JSON.stringify({ op: "move", from, to, path: folder }),
    headers: { "Content-Type": "application/json" },
  });
  if (moved.error) return { error: moved.error };

  const updated = await supabase.from("photos").update({ filename: to }).eq("id", photoId);
  if (updated.error) {
    // On remet le fichier à sa place pour ne pas casser la fiche.
    await call({
      body: JSON.stringify({ op: "move", from: to, to: from, path: folder }),
      headers: { "Content-Type": "application/json" },
    });
    return { error: updated.error as Err };
  }

  if (isCover) {
    const cov = await supabase.from("voitures").update({ cover_photo: to }).eq("id", voitureId);
    if (cov.error) return { error: cov.error as Err };
  }
  return { error: null as Err };
}
