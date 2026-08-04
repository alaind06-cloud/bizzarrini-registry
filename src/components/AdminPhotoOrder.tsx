import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, photoUrl, SITE_MARQUE, type Photo, type Voiture } from "@/lib/supabase";
import { MANUAL_ORDER_BASE } from "@/lib/photo-order";
import { MODEL_GROUPS } from "@/data/model-groups";
import { PhotoRetouch } from "@/components/admin/PhotoRetouch";
import { PhotoBatchUpload } from "@/components/admin/PhotoBatchUpload";
import { setPhotoRetouched } from "@/lib/photo-storage";



/**
 * Tri manuel des photos d'une fiche châssis (glisser-déposer).
 * L'ordre est enregistré automatiquement dans `photos.ordre` avec un décalage
 * sentinelle (MANUAL_ORDER_BASE) : la fiche publique détecte ainsi un ordre
 * validé manuellement et désactive le tri automatique (NB / couleur).
 */

type SaveState = "idle" | "saving" | "saved" | "error";

export function AdminPhotoOrder() {
  const [cars, setCars] = useState<Voiture[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [carId, setCarId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<number | null>(null);
  const [retouch, setRetouch] = useState<Photo | null>(null);

  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: carRows }, { data: photoRows }] = await Promise.all([
        supabase
          .from("voitures")
          .select("id, titre, modele, annee, chassis, cover_photo, photo_prefix")
          .eq("marque", SITE_MARQUE)
          .order("id", { ascending: true }),
        supabase.from("photos").select("voiture_id, ordre"),
      ]);
      setCars((carRows as Voiture[]) ?? []);
      const state = new Map<string, boolean>();
      for (const p of (photoRows as { voiture_id: string; ordre: number | null }[]) ?? []) {
        const ok = (p.ordre ?? -1) >= MANUAL_ORDER_BASE;
        state.set(p.voiture_id, (state.get(p.voiture_id) ?? true) && ok);
      }
      setDone(new Set([...state.entries()].filter(([, v]) => v).map(([k]) => k)));
    })();
  }, []);

  useEffect(() => {
    setSelected(new Set());
    setPreview(null);
    if (!carId) {
      setPhotos([]);
      setCover(null);
      return;
    }
    (async () => {
      setLoading(true);
      setSave("idle");
      setError(null);
      const [{ data }, { data: car }] = await Promise.all([
        supabase
          .from("photos")
          .select("*")
          .eq("voiture_id", carId)
          .order("ordre", { ascending: true }),
        supabase.from("voitures").select("cover_photo").eq("id", carId).maybeSingle(),
      ]);
      setPhotos((data as Photo[]) ?? []);
      setCover((car as { cover_photo: string | null } | null)?.cover_photo ?? null);
      setLoading(false);
    })();
  }, [carId]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const g = group ? MODEL_GROUPS.find((x) => x.key === group) : undefined;
    return cars.filter((c) => {
      if (g && !(c.modele && g.test(c.modele))) return false;
      if (!q) return true;
      return [c.chassis, c.titre, c.modele, c.annee]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [cars, query, group]);

  const idx = filtered.findIndex((c) => c.id === carId);
  const goto = useCallback(
    (delta: number) => {
      if (!filtered.length) return;
      const next = idx < 0 ? 0 : idx + delta;
      if (next < 0 || next >= filtered.length) return;
      setCarId(filtered[next].id);
    },
    [filtered, idx],
  );

  const persist = useCallback(async (list: Photo[], voitureId: string) => {
    setSave("saving");
    setError(null);
    const results = await Promise.all(
      list.map((p, i) =>
        supabase.from("photos").update({ ordre: MANUAL_ORDER_BASE + i }).eq("id", p.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setSave("error");
      setError(failed.error.message);
      return;
    }
    setSave("saved");
    setDone((s) => new Set(s).add(voitureId));
  }, []);

  const commit = (next: Photo[]) => {
    setPhotos(next);
    void persist(next, carId);
  };

  /** Déplace un bloc (sélection multiple si la vignette tirée en fait partie). */
  const moveTo = (from: number, to: number) => {
    if (from < 0 || from >= photos.length) return;
    const dragged = photos[from];
    const block =
      selected.size > 1 && selected.has(dragged.id)
        ? photos.filter((p) => selected.has(p.id))
        : [dragged];
    const rest = photos.filter((p) => !block.includes(p));
    const target = photos[Math.max(0, Math.min(to, photos.length - 1))];
    let insert = rest.indexOf(target);
    if (insert < 0) insert = to >= photos.length - 1 ? rest.length : 0;
    else if (to > from) insert += 1;
    const next = [...rest.slice(0, insert), ...block, ...rest.slice(insert)];
    if (next.every((p, i) => p.id === photos[i].id)) return;
    commit(next);
  };

  const sendEdge = (i: number, edge: "first" | "last") => {
    const target = photos[i];
    const block =
      selected.size > 1 && selected.has(target.id)
        ? photos.filter((p) => selected.has(p.id))
        : [target];
    const rest = photos.filter((p) => !block.includes(p));
    commit(edge === "first" ? [...block, ...rest] : [...rest, ...block]);
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const setAsCover = async (filename: string) => {
    setSave("saving");
    const { error: err } = await supabase
      .from("voitures")
      .update({ cover_photo: filename })
      .eq("id", carId);
    if (err) {
      setSave("error");
      setError(err.message);
      return;
    }
    setCover(filename);
    setCars((list) => list.map((c) => (c.id === carId ? { ...c, cover_photo: filename } : c)));
    setSave("saved");
  };

  const currentCar = cars.find((c) => c.id === carId);
  const uploadPrefix =
    currentCar?.photo_prefix ||
    photos[0]?.filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]?\d+$/, "") ||
    "photo";

  const retouchedCount = photos.filter((p) => p.retouchee).length;

  /** Bascule le statut « retouchée » d'une photo (enregistré aussitôt en base). */
  const toggleRetouched = async (p: Photo) => {
    const value = !p.retouchee;
    setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, retouchee: value } : x)));
    const res = await setPhotoRetouched(p.id, value);
    if (res.error) {
      setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, retouchee: !value } : x)));
      setSave("error");
      setError(
        res.missingColumn
          ? "Colonne « retouchee » manquante : exécutez supabase_migration_photos_retouchee.sql."
          : res.error.message,
      );
    }
  };


  // Navigation clavier entre fiches + visionneuse
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      if (preview !== null) {
        if (e.key === "Escape") setPreview(null);
        else if (e.key === "ArrowLeft") setPreview((v) => Math.max(0, (v ?? 0) - 1));
        else if (e.key === "ArrowRight")
          setPreview((v) => Math.min(photos.length - 1, (v ?? 0) + 1));
        return;
      }
      if (e.key === "ArrowLeft") goto(-1);
      else if (e.key === "ArrowRight") goto(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goto, preview, photos.length]);

  const label = (c: Voiture) =>
    `${done.has(c.id) ? "✓ " : "• "}${[c.annee, c.modele ?? c.titre, c.chassis].filter(Boolean).join(" · ")}`;

  const pct = cars.length ? Math.round((done.size / cars.length) * 100) : 0;

  return (
    <div>
      <div className="mb-6 border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm">
            <strong className="text-brand">{done.size}</strong> / {cars.length} châssis réorganisés
          </span>
          <span className="text-xs text-muted-foreground">{pct} %</span>
        </div>
        <div className="mt-2 h-1 w-full bg-border">
          <div className="h-1 bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-full bg-surface border border-border px-3 py-2 text-sm"
        >
          <option value="">Tous les modèles</option>
          {MODEL_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un châssis…"
          className="w-full bg-surface border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => goto(-1)}
            disabled={idx <= 0}
            aria-label="Fiche précédente"
            className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-30"
          >
            ← Préc.
          </button>
          <button
            onClick={() => goto(1)}
            disabled={idx < 0 ? filtered.length === 0 : idx >= filtered.length - 1}
            aria-label="Fiche suivante"
            className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-30"
          >
            Suiv. →
          </button>
        </div>
      </div>

      <div className="mb-6">
        <select
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          className="w-full bg-surface border border-border px-3 py-2 text-sm"
        >
          <option value="">— Choisir une fiche châssis —</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id} className={done.has(c.id) ? "text-brand" : undefined}>
              {label(c)}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} fiches affichées · flèches ← → du clavier pour changer de fiche
        </p>
      </div>

      {carId && !loading && (
        <PhotoBatchUpload
          voitureId={carId}
          prefix={uploadPrefix}
          existing={photos}
          onUploaded={(added) => setPhotos((list) => [...list, ...added])}
        />
      )}

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
          <div className="mb-4 border border-border bg-surface px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span>
                <strong className="text-brand">{retouchedCount}</strong> / {photos.length} retouchées
                {photos.length - retouchedCount > 0 && (
                  <> · {photos.length - retouchedCount} à valider</>
                )}
              </span>
              <span className="text-muted-foreground">
                Le statut est enregistré au fur et à mesure (colonne <code>photos.retouchee</code>)
              </span>
            </div>
            <div className="mt-2 h-1 w-full bg-border">
              <div
                className="h-1 bg-brand transition-all"
                style={{
                  width: `${photos.length ? Math.round((retouchedCount / photos.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground">
              {photos.length} photos · glissez une vignette (Ctrl+clic pour sélectionner plusieurs)
            </span>

            {selected.size > 0 && (
              <span className="text-xs text-brand">
                {selected.size} sélectionnée{selected.size > 1 ? "s" : ""} ·{" "}
                <button onClick={() => setSelected(new Set())} className="underline">
                  tout désélectionner
                </button>
              </span>
            )}
            <span
              className={`text-xs ${save === "error" ? "text-destructive" : "text-brand"}`}
              aria-live="polite"
            >
              {save === "saving"
                ? "Enregistrement…"
                : save === "saved"
                  ? "✓ Enregistré"
                  : save === "error"
                    ? `Échec : ${error}`
                    : ""}
            </span>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 list-none p-0 m-0">
            {photos.map((p, i) => (
              <li
                key={p.id}
                draggable
                title={p.filename}
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
                  if (dragIdx.current !== null) moveTo(dragIdx.current, i);
                  dragIdx.current = null;
                  setOverIdx(null);
                }}
                onDragEnd={() => {
                  dragIdx.current = null;
                  setOverIdx(null);
                }}
                className={`group relative border bg-surface cursor-grab active:cursor-grabbing transition-colors ${
                  overIdx === i
                    ? "border-brand"
                    : selected.has(p.id)
                      ? "border-brand/70 ring-1 ring-brand/40"
                      : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.shiftKey) toggleSelect(p.id);
                    else setPreview(i);
                  }}
                  className="block w-full"
                  aria-label={`Aperçu de ${p.filename}`}
                >
                  <img
                    src={photoUrl(p.filename, { width: 300, quality: 60 }) ?? undefined}
                    alt={p.filename}
                    loading="lazy"
                    draggable={false}
                    className="w-full aspect-[4/3] object-cover select-none"
                  />
                </button>

                <span className="absolute top-1 left-1 bg-background/85 px-1.5 py-0.5 text-[0.65rem] tracking-wider">
                  {i + 1}
                </span>

                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  aria-label={`Sélectionner ${p.filename}`}
                  className="absolute top-1 right-1 h-4 w-4 accent-[hsl(var(--brand,0_70%_45%))]"
                />

                {cover === p.filename && (
                  <span className="absolute bottom-9 left-1 bg-brand text-background px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider">
                    Cover
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => void toggleRetouched(p)}
                  title={p.retouchee ? "Marquer comme à valider" : "Marquer comme retouchée"}
                  className={`absolute bottom-9 right-1 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider ${
                    p.retouchee
                      ? "bg-brand text-background"
                      : "bg-background/85 text-muted-foreground"
                  }`}
                >
                  {p.retouchee ? "✓ retouchée" : "à valider"}
                </button>


                <span className="pointer-events-none absolute inset-x-0 bottom-9 hidden group-hover:block bg-background/90 px-1 py-0.5 text-[0.6rem] break-all">
                  {p.filename}
                </span>

                <div className="flex items-center justify-between gap-1 px-1 py-1">
                  <button
                    onClick={() => sendEdge(i, "first")}
                    disabled={i === 0}
                    title="Envoyer en première position"
                    aria-label="Envoyer en première position"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ⇤
                  </button>
                  <button
                    onClick={() => moveTo(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Déplacer avant"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => void setAsCover(p.filename)}
                    title="Définir comme photo principale"
                    aria-label="Définir comme photo principale"
                    className={`px-1 text-xs ${cover === p.filename ? "text-brand" : "text-muted-foreground hover:text-brand"}`}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => setRetouch(p)}
                    title="Retoucher / renommer cette photo"
                    aria-label="Retoucher ou renommer cette photo"
                    className="px-1 text-xs text-muted-foreground hover:text-brand"
                  >
                    ✂
                  </button>

                  <button
                    onClick={() => moveTo(i, i + 1)}
                    disabled={i === photos.length - 1}
                    aria-label="Déplacer après"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    →
                  </button>
                  <button
                    onClick={() => sendEdge(i, "last")}
                    disabled={i === photos.length - 1}
                    title="Envoyer en dernière position"
                    aria-label="Envoyer en dernière position"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ⇥
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {preview !== null && photos[preview] && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img
            src={photoUrl(photos[preview].filename, { width: 1600, quality: 80 }) ?? undefined}
            alt={photos[preview].filename}
            className="max-h-[80vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="mt-4 flex items-center gap-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview((v) => Math.max(0, (v ?? 0) - 1))}
              disabled={preview === 0}
              className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-muted-foreground">
              {preview + 1} / {photos.length} · {photos[preview].filename}
            </span>
            <button
              onClick={() => setPreview((v) => Math.min(photos.length - 1, (v ?? 0) + 1))}
              disabled={preview === photos.length - 1}
              className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-30"
            >
              →
            </button>
            <button
              onClick={() => void setAsCover(photos[preview].filename)}
              className="btn-ghost !py-1.5 !px-3 !text-xs"
            >
              ★ Photo principale
            </button>
            <button onClick={() => setPreview(null)} className="btn-ghost !py-1.5 !px-3 !text-xs">
              ✕
            </button>
          </div>
        </div>
      )}

      {retouch && (
        <PhotoRetouch
          photo={retouch}
          isCover={cover === retouch.filename}
          onClose={() => setRetouch(null)}
          onRenamed={(id, filename) => {
            setPhotos((list) => list.map((p) => (p.id === id ? { ...p, filename } : p)));
            setCover((c) => (c === retouch.filename ? filename : c));
          }}
          onRetouched={(id) =>
            setPhotos((list) => list.map((p) => (p.id === id ? { ...p, retouchee: true } : p)))
          }

        />
      )}
    </div>

  );
}
