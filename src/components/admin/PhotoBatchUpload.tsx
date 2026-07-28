import { useRef, useState } from "react";
import { supabase, type Photo } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/photo-storage";
import { MANUAL_ORDER_BASE } from "@/lib/photo-order";
import { canvasToJpeg, detectCrop, loadOriented, renderEdited } from "@/lib/image-edit";

/**
 * Ajout de nouvelles photos sur une fiche châssis existante.
 * Gros lots acceptés (50+ fichiers) : chaque photo est traitée puis envoyée
 * une par une (rotation EXIF + recadrage automatique des bordures, qualité
 * d'origine conservée) et sa ligne en base est créée immédiatement avec
 * `retouchee = false`. L'état est donc sauvegardé au fur et à mesure : quitter
 * la page ne perd rien, la validation manuelle (outil ✂) peut être reprise
 * plus tard.
 */

type Props = {
  voitureId: string;
  prefix: string;
  existing: Photo[];
  onUploaded: (photos: Photo[]) => void;
};

type Item = {
  name: string;
  state: "attente" | "traitement" | "envoi" | "ok" | "erreur";
  message?: string;
};

export function PhotoBatchUpload({ voitureId, prefix, existing, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const patch = (i: number, next: Partial<Item>) =>
    setItems((list) => list.map((x, k) => (k === i ? { ...x, ...next } : x)));

  const run = async (files: File[]) => {
    const list = files.filter((f) => f.type.startsWith("image/"));
    if (!list.length || running) return;
    setItems(list.map((f) => ({ name: f.name, state: "attente" })));
    setRunning(true);

    const taken = new Set(existing.map((p) => p.filename));
    let counter = existing.length;
    let maxOrdre = existing.reduce(
      (m, p) => Math.max(m, p.ordre ?? 0),
      MANUAL_ORDER_BASE + existing.length - 1,
    );
    const created: Photo[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        patch(i, { state: "traitement" });
        const source = await loadOriented(file);
        const blob = await canvasToJpeg(renderEdited(source, detectCrop(source), 0));

        let filename = "";
        do {
          counter += 1;
          filename = `${prefix}-${String(counter).padStart(2, "0")}.jpg`;
        } while (taken.has(filename));
        taken.add(filename);

        patch(i, { state: "envoi" });
        const { error: upErr } = await uploadPhoto(filename, blob);
        if (upErr) throw new Error(upErr.message);

        maxOrdre += 1;
        const row = { voiture_id: voitureId, filename, ordre: maxOrdre, retouchee: false };
        let res = await supabase.from("photos").insert(row).select("*").single();
        if (res.error && /retouchee/i.test(res.error.message)) {
          // Colonne pas encore créée : on insère sans le statut.
          const { retouchee: _drop, ...fallback } = row;
          res = await supabase.from("photos").insert(fallback).select("*").single();
        }
        if (res.error || !res.data) throw new Error(res.error?.message ?? "Insertion impossible");

        created.push(res.data as Photo);
        patch(i, { state: "ok" });
      } catch (e) {
        patch(i, { state: "erreur", message: (e as Error).message });
      }
    }

    setRunning(false);
    if (created.length) onUploaded(created);
  };

  const okCount = items.filter((x) => x.state === "ok").length;
  const errCount = items.filter((x) => x.state === "erreur").length;

  return (
    <div className="mb-6 border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          Ajouter des photos à cette fiche
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={running}
          className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-40"
        >
          Choisir des fichiers
        </button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void run([...e.dataTransfer.files]);
        }}
        onClick={() => !running && inputRef.current?.click()}
        className={`mt-3 cursor-pointer border border-dashed px-4 py-6 text-center text-xs ${
          over ? "border-brand text-brand" : "border-border text-muted-foreground"
        }`}
      >
        Glissez ici jusqu'à 50 photos (ou plus) — rotation EXIF et recadrage automatique des
        bordures appliqués, sans compression. Chaque photo est enregistrée dès son envoi.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void run([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span>
              {okCount} / {items.length} envoyées
              {errCount > 0 && <span className="text-destructive"> · {errCount} en échec</span>}
            </span>
            <span className="text-muted-foreground">
              {running ? "Traitement en cours…" : "Terminé"}
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-border">
            <div
              className="h-1 bg-brand transition-all"
              style={{ width: `${Math.round((okCount / items.length) * 100)}%` }}
            />
          </div>
          <ul className="mt-2 max-h-40 overflow-y-auto text-[0.7rem] text-muted-foreground list-none p-0 m-0">
            {items.map((x, i) => (
              <li key={`${x.name}-${i}`} className="flex justify-between gap-2 py-0.5">
                <span className="truncate">{x.name}</span>
                <span className={x.state === "erreur" ? "text-destructive" : undefined}>
                  {x.state === "ok" ? "✓" : x.state === "erreur" ? `✕ ${x.message}` : x.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
