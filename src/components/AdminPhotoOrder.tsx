import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, photoUrl, type Photo, type Voiture } from "@/lib/supabase";
import { MANUAL_ORDER_BASE } from "@/lib/photo-order";
import { MODEL_GROUPS } from "@/data/model-groups";

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
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: carRows }, { data: photoRows }] = await Promise.all([
        supabase
          .from("voitures")
          .select("id, titre, modele, annee, chassis, cover_photo, photo_prefix")
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
    if (!carId) {
      setPhotos([]);
      return;
    }
    (async () => {
      setLoading(true);
      setSave("idle");
      setError(null);
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

  const persist = useCallback(
    async (list: Photo[], voitureId: string) => {
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
    },
    [],
  );

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setPhotos(next);
    void persist(next, carId);
  };

  // Navigation clavier entre fiches (hors saisie texte)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === "ArrowLeft") goto(-1);
      else if (e.key === "ArrowRight") goto(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goto]);

  const label = (c: Voiture) =>
    `${done.has(c.id) ? "✓ " : "• "}${[c.annee, c.modele ?? c.titre, c.chassis].filter(Boolean).join(" · ")}`;

  return (
    <div>
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
          {done.size} / {cars.length} fiches réorganisées · {filtered.length} affichées ·
          {" "}flèches ← → du clavier pour changer de fiche
        </p>
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
            <span className="text-xs text-muted-foreground">
              {photos.length} photos · glissez une vignette pour la déplacer
            </span>
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
