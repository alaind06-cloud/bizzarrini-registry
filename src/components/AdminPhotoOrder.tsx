import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, photoUrl, type Photo, type Voiture } from "@/lib/supabase";
import { MANUAL_ORDER_BASE } from "@/lib/photo-order";

/**
 * Tri manuel des photos d'une fiche châssis (glisser-déposer).
 * L'ordre est enregistré dans `photos.ordre` avec un décalage sentinelle
 * (MANUAL_ORDER_BASE) : la fiche publique détecte ainsi un ordre validé
 * manuellement et désactive le tri automatique (NB / couleur).
 */

export function AdminPhotoOrder() {
  const [cars, setCars] = useState<Voiture[]>([]);
  const [carId, setCarId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("voitures")
        .select("id, titre, modele, annee, chassis, cover_photo, photo_prefix")
        .order("id", { ascending: true });
      setCars((data as Voiture[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!carId) {
      setPhotos([]);
      return;
    }
    (async () => {
      setLoading(true);
      setMsg(null);
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("voiture_id", carId)
        .order("ordre", { ascending: true });
      setPhotos((data as Photo[]) ?? []);
      setLoading(false);
    })();
  }, [carId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) =>
      [c.chassis, c.titre, c.modele, c.annee].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [cars, query]);

  const move = (from: number, to: number) => {
    setPhotos((list) => {
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setMsg(null);
  };

  const save = async () => {
    if (!photos.length) return;
    setSaving(true);
    setMsg(null);
    const results = await Promise.all(
      photos.map((p, i) =>
        supabase.from("photos").update({ ordre: MANUAL_ORDER_BASE + i }).eq("id", p.id),
      ),
    );
    const failed = results.find((r) => r.error);
    setSaving(false);
    setMsg(
      failed?.error
        ? `Échec de l'enregistrement : ${failed.error.message}`
        : "Ordre enregistré — il s'applique désormais à tous les visiteurs.",
    );
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un châssis…"
          className="w-full bg-surface border border-border px-3 py-2 text-sm"
        />
        <select
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          className="w-full bg-surface border border-border px-3 py-2 text-sm"
        >
          <option value="">— Choisir une fiche châssis —</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.annee, c.modele ?? c.titre, c.chassis].filter(Boolean).join(" · ")}
            </option>
          ))}
        </select>
      </div>

      {!carId ? (
        <p className="text-muted-foreground text-sm">
          Sélectionnez une fiche pour réordonner sa galerie par glisser-déposer.
        </p>
      ) : loading ? (
        <p className="text-muted-foreground text-sm">Chargement des photos…</p>
      ) : photos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune photo pour cette fiche.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button onClick={save} disabled={saving} className="btn-brand !py-1.5 !px-4 !text-xs">
              {saving ? "Enregistrement…" : "Enregistrer l'ordre"}
            </button>
            <span className="text-xs text-muted-foreground">
              {photos.length} photos · glissez une vignette pour la déplacer
            </span>
            {msg && <span className="text-xs text-brand">{msg}</span>}
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 list-none p-0 m-0">
            {photos.map((p, i) => (
              <li
                key={p.id}
                draggable
                onDragStart={() => {
                  dragIdx.current = i;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIdx(i);
                }}
                onDragLeave={() => setOverIdx((v) => (v === i ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIdx.current !== null) move(dragIdx.current, i);
                  dragIdx.current = null;
                  setOverIdx(null);
                }}
                onDragEnd={() => {
                  dragIdx.current = null;
                  setOverIdx(null);
                }}
                className={`relative border bg-surface cursor-grab active:cursor-grabbing transition-colors ${
                  overIdx === i ? "border-brand" : "border-border"
                }`}
              >
                <img
                  src={photoUrl(p.filename, { width: 300, quality: 60 }) ?? undefined}
                  alt={p.filename}
                  loading="lazy"
                  draggable={false}
                  className="w-full aspect-[4/3] object-cover select-none"
                />
                <span className="absolute top-1 left-1 bg-background/85 px-1.5 py-0.5 text-[0.65rem] tracking-wider">
                  {i + 1}
                </span>
                <div className="flex justify-between px-1 py-1">
                  <button
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Déplacer avant"
                    className="px-2 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => move(i, i + 1)}
                    disabled={i === photos.length - 1}
                    aria-label="Déplacer après"
                    className="px-2 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
