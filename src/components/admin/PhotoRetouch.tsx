import { useEffect, useState } from "react";
import { photoUrl, type Photo } from "@/lib/supabase";
import { PhotoCropEditor } from "@/components/admin/PhotoCropEditor";
import { renamePhoto, replacePhoto, setPhotoRetouched } from "@/lib/photo-storage";
import {
  canvasToJpeg,
  detectCrop,
  loadFromUrl,
  renderEdited,
  safeFilename,
  type CropRect,
} from "@/lib/image-edit";

/**
 * Retouche (recadrage / rotation) et renommage d'une photo déjà en ligne.
 * Le fichier de stockage et la référence en base sont mis à jour ensemble.
 */

type Props = {
  photo: Photo;
  isCover: boolean;
  onClose: () => void;
  onRenamed: (photoId: string, filename: string) => void;
  onRetouched?: (photoId: string) => void;
};


export function PhotoRetouch({ photo, isCover, onClose, onRenamed, onRetouched }: Props) {
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [auto, setAuto] = useState<CropRect | null>(null);
  const [rotation, setRotation] = useState(0);
  const [name, setName] = useState(photo.filename);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = photoUrl(photo.filename);
        if (!url) throw new Error("Photo introuvable");
        const canvas = await loadFromUrl(url);
        if (!alive) return;
        const rect = detectCrop(canvas);
        setSource(canvas);
        setAuto(rect);
        setCrop(rect);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [photo.filename]);

  const apply = async () => {
    if (!source || !crop) return;
    setBusy("Enregistrement de la retouche…");
    setError(null);
    try {
      const blob = await canvasToJpeg(renderEdited(source, crop, rotation));
      const { error: err } = await replacePhoto(photo.filename, blob);
      if (err) throw new Error(err.message);
      const target = safeFilename(name);
      if (target !== photo.filename) {
        setBusy("Renommage…");
        const res = await renamePhoto({
          photoId: photo.id,
          voitureId: photo.voiture_id,
          from: photo.filename,
          to: target,
          isCover,
        });
        if (res.error) throw new Error(res.error.message);
        onRenamed(photo.id, target);
      }
      const mark = await setPhotoRetouched(photo.id, true);
      if (mark.error && !mark.missingColumn) throw new Error(mark.error.message);
      if (!mark.error) onRetouched?.(photo.id);
      onClose();

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl break-all">{photo.filename}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost !text-xs">Annuler</button>
            <button
              onClick={() => void apply()}
              disabled={!source || Boolean(busy)}
              className="btn-brand !text-xs disabled:opacity-40"
            >
              {busy ?? "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="pr-name"
            className="block mb-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Nom du fichier
          </label>
          <input
            id="pr-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-xl bg-surface border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enregistré sous <code>{safeFilename(name)}</code> — le fichier et la fiche sont mis à
            jour ensemble.
          </p>
        </div>

        {error && (
          <p className="mb-4 border border-destructive/50 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </p>
        )}

        {!source || !crop ? (
          <p className="text-sm text-muted-foreground">Chargement de la photo…</p>
        ) : (
          <PhotoCropEditor
            source={source}
            crop={crop}
            rotation={rotation}
            onChange={(n) => {
              setCrop(n.crop);
              setRotation(n.rotation);
            }}
            onReset={() => {
              if (auto) setCrop(auto);
              setRotation(0);
            }}
          />
        )}
      </div>
    </div>
  );
}
