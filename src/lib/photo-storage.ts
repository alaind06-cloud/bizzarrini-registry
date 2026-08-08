import { supabase } from "@/lib/supabase";

/**
 * Écriture des photos du registre : bucket Cloudflare R2
 * `registre-voitures-photos`, préfixe `bizzarrini/`, même nom de fichier que
 * `photos.filename`. La lecture reste assurée par `photoUrl()` (URL publique
 * R2). Plus aucun accès à Supabase Storage.
 */

export const PHOTO_BUCKET = "registre-voitures-photos";
export const PHOTO_FOLDER = "bizzarrini";

const ENDPOINT = "/api/admin-photos";

type Err = { message: string } | null;

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

/** Envoie un fichier dans R2 (sans écraser un fichier existant). */
export async function uploadPhoto(filename: string, blob: Blob) {
  return call({
    body: blob,
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "x-photo-filename": filename,
      "x-photo-op": "upload",
    },
  });
}

/** Remplace le contenu d'une photo existante (retouche). */
export async function replacePhoto(filename: string, blob: Blob) {
  return call({
    body: blob,
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "x-photo-filename": filename,
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
 * Renomme une photo : déplace le fichier dans R2 puis met à jour la
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
  if (from === to) return { error: null as Err };

  const moved = await call({
    body: JSON.stringify({ op: "move", from, to }),
    headers: { "Content-Type": "application/json" },
  });
  if (moved.error) return { error: moved.error };

  const updated = await supabase.from("photos").update({ filename: to }).eq("id", photoId);
  if (updated.error) {
    // On remet le fichier à sa place pour ne pas casser la fiche.
    await call({
      body: JSON.stringify({ op: "move", from: to, to: from }),
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
