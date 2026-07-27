/**
 * Détection "noir & blanc / sépia / document" d'une photo, côté client.
 * On charge une miniature très légère, on échantillonne les pixels et on mesure :
 *  - la saturation moyenne (les NB purs et les scans sont quasi désaturés) ;
 *  - la cohérence de teinte (les tirages sépia / virés / jaunis ont une
 *    saturation modérée mais une teinte unique, contrairement aux photos couleur).
 */
const cache = new Map<string, Promise<boolean>>();

const GRAY_THRESHOLD = 0.12; // NB franc
const TONED_SAT_MAX = 0.42; // sépia / photo jaunie
const HUE_SPREAD_MAX = 42; // degrés : teinte quasi unique => virage monochrome

function measure(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = 48;
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w)) || 48;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        let satSum = 0;
        let count = 0;
        // Moyenne circulaire des teintes, pondérée par la saturation.
        let hx = 0;
        let hy = 0;
        let hw = 0;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 16) continue;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const d = max - min;
          const sat = max === 0 ? 0 : d / max;
          satSum += sat;
          count++;
          if (d > 0.02) {
            let hue: number;
            if (max === r) hue = ((g - b) / d) % 6;
            else if (max === g) hue = (b - r) / d + 2;
            else hue = (r - g) / d + 4;
            const rad = ((hue * 60 + 360) % 360) * (Math.PI / 180);
            hx += Math.cos(rad) * sat;
            hy += Math.sin(rad) * sat;
            hw += sat;
          }
        }

        if (!count) return resolve(false);
        const meanSat = satSum / count;
        if (meanSat < GRAY_THRESHOLD) return resolve(true);
        if (meanSat > TONED_SAT_MAX || hw === 0) return resolve(false);

        // Dispersion de teinte : |vecteur moyen| proche de 1 = teinte unique.
        const resultant = Math.hypot(hx, hy) / hw;
        const spreadDeg = (Math.sqrt(Math.max(0, -2 * Math.log(Math.min(1, resultant)))) * 180) / Math.PI;
        resolve(spreadDeg < HUE_SPREAD_MAX);
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

/**
 * Ordre validé manuellement depuis /admin : les valeurs de `photos.ordre`
 * sont écrites avec ce décalage sentinelle pour distinguer un tri choisi
 * par le webmaster d'un ordre d'import brut.
 */
export const MANUAL_ORDER_BASE = 1000;

export function hasManualOrder(list: { ordre: number | null }[]): boolean {
  return list.length > 0 && list.every((p) => (p.ordre ?? -1) >= MANUAL_ORDER_BASE);
}
