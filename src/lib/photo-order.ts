/**
 * Détection "noir & blanc / document" d'une photo, côté client.
 * On charge une miniature très légère, on échantillonne les pixels et on
 * mesure la saturation moyenne : les photos NB et les documents scannés
 * (cartes grises, certificats, coupures de presse) sont quasi désaturés.
 */
const cache = new Map<string, Promise<boolean>>();

const SATURATION_THRESHOLD = 0.085; // 0 = gris parfait

function measure(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = 32;
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w)) || 32;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 16) continue;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          sum += max === 0 ? 0 : (max - min) / max;
          count++;
        }
        resolve(count > 0 && sum / count < SATURATION_THRESHOLD);
      } catch {
        resolve(false); // canvas "tainted" ou erreur : on ne réordonne pas
      }
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export function isMonochrome(url: string | null | undefined): Promise<boolean> {
  if (!url || typeof document === "undefined") return Promise.resolve(false);
  const hit = cache.get(url);
  if (hit) return hit;
  const p = measure(url);
  cache.set(url, p);
  return p;
}
