/**
 * Préparation des photos avant envoi : rotation EXIF, détection et recadrage
 * des bordures inutiles (même logique que le script `crop_supabase.py` utilisé
 * sur les photos déjà en ligne), puis export JPEG *sans réduction de taille* :
 * la définition d'origine est conservée, seule la bordure est retirée.
 */

export type CropRect = { x: number; y: number; w: number; h: number };

/** Qualité d'export : très élevée, aucune réduction de définition. */
const EXPORT_QUALITY = 0.95;

/** Charge un fichier image en respectant l'orientation EXIF. */
export async function loadOriented(file: Blob): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = null;
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  if (bitmap) {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return canvas;
  }

  // Repli : <img> classique (l'orientation EXIF est appliquée par le navigateur).
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image illisible"));
      el.src = url;
    });
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  } finally {
    URL.revokeObjectURL(url);
  }
  return canvas;
}

/** Charge une image distante (photo déjà en ligne) pour retouche. */
export async function loadFromUrl(url: string): Promise<HTMLCanvasElement> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
  return loadOriented(await res.blob());
}

/**
 * Détecte les bordures uniformes (blanches, noires ou de couleur unie) autour
 * du sujet et renvoie le rectangle utile. Analyse faite sur une miniature.
 */
export function detectCrop(source: HTMLCanvasElement, tolerance = 18): CropRect {
  const full: CropRect = { x: 0, y: 0, w: source.width, h: source.height };
  const aw = Math.min(400, source.width);
  const ah = Math.max(1, Math.round((source.height / source.width) * aw));
  const small = document.createElement("canvas");
  small.width = aw;
  small.height = ah;
  const ctx = small.getContext("2d", { willReadFrequently: true });
  if (!ctx) return full;
  ctx.drawImage(source, 0, 0, aw, ah);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, aw, ah).data;
  } catch {
    return full;
  }

  const at = (x: number, y: number) => {
    const i = (y * aw + x) * 4;
    return [data[i], data[i + 1], data[i + 2]] as const;
  };

  // Couleur de référence : moyenne des quatre coins.
  const corners = [at(0, 0), at(aw - 1, 0), at(0, ah - 1), at(aw - 1, ah - 1)];
  const ref = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / corners.length);
  const near = (p: readonly [number, number, number]) =>
    Math.abs(p[0] - ref[0]) <= tolerance &&
    Math.abs(p[1] - ref[1]) <= tolerance &&
    Math.abs(p[2] - ref[2]) <= tolerance;

  const rowUniform = (y: number) => {
    let off = 0;
    for (let x = 0; x < aw; x++) if (!near(at(x, y))) off++;
    return off / aw < 0.02;
  };
  const colUniform = (x: number) => {
    let off = 0;
    for (let y = 0; y < ah; y++) if (!near(at(x, y))) off++;
    return off / ah < 0.02;
  };

  let top = 0;
  while (top < ah - 2 && rowUniform(top)) top++;
  let bottom = ah - 1;
  while (bottom > top + 2 && rowUniform(bottom)) bottom--;
  let left = 0;
  while (left < aw - 2 && colUniform(left)) left++;
  let right = aw - 1;
  while (right > left + 2 && colUniform(right)) right--;

  const sx = source.width / aw;
  const sy = source.height / ah;
  const rect: CropRect = {
    x: Math.round(left * sx),
    y: Math.round(top * sy),
    w: Math.round((right - left + 1) * sx),
    h: Math.round((bottom - top + 1) * sy),
  };
  // Garde-fou : on n'ampute jamais plus de 40 % de l'image.
  if (rect.w < source.width * 0.6 || rect.h < source.height * 0.6) return full;
  return rect;
}

/** Applique un recadrage puis une rotation (quarts de tour) sans rééchantillonner. */
export function renderEdited(
  source: HTMLCanvasElement,
  crop: CropRect,
  quarterTurns = 0,
): HTMLCanvasElement {
  const q = ((quarterTurns % 4) + 4) % 4;
  const out = document.createElement("canvas");
  const swap = q === 1 || q === 3;
  out.width = swap ? crop.h : crop.w;
  out.height = swap ? crop.w : crop.h;
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.save();
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((q * Math.PI) / 2);
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, -crop.w / 2, -crop.h / 2, crop.w, crop.h);
  ctx.restore();
  return out;
}

export function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export JPEG impossible"))),
      "image/jpeg",
      EXPORT_QUALITY,
    );
  });
}

/** Nom de fichier sûr pour le stockage (minuscules, tirets, extension .jpg). */
export function safeFilename(name: string): string {
  const base = name
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "photo"}.jpg`;
}
