import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, photoUrl, type Voiture } from "@/lib/supabase";
import { MODEL_GROUPS, sortCars } from "@/data/model-groups";
import { displayChassis } from "@/data/chassis-clean";

/**
 * Ordre d'affichage manuel des châssis du registre (glisser-déposer).
 * L'ordre est enregistré dans `voitures.ordre_affichage` et remplace
 * intégralement le tri automatique par série / année côté public.
 */

type SaveState = "idle" | "saving" | "saved" | "error";

const MISSING_COLUMN_SQL = `alter table public.voitures
  add column if not exists ordre_affichage integer;`;

export function AdminChassisOrder() {
  const [cars, setCars] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("voitures").select("*").order("id", { ascending: true });
      const clean = ((data as Voiture[]) ?? []).filter(
        (v) => (v.titre ?? "").trim().toUpperCase() !== "COVER" && (v.modele ?? "").trim().toUpperCase() !== "COVER",
      );
      setCars(sortCars(clean));
      setLoading(false);
    })();
  }, []);

  const ordered = cars.filter((c) => typeof c.ordre_affichage === "number").length;

  /** Le glisser-déposer n'est actif que sur la liste complète (sans filtre). */
  const filtering = Boolean(query.trim() || group);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const g = group ? MODEL_GROUPS.find((x) => x.key === group) : undefined;
    return cars.filter((c) => {
      if (g && !(c.modele && g.test(c.modele))) return false;
      if (!q) return true;
      return [c.chassis, displayChassis(c.chassis), c.titre, c.modele, c.annee]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [cars, query, group]);

  const persist = useCallback(async (list: Voiture[], from: number) => {
    setSave("saving");
    setError(null);
    const slice = list.slice(Math.max(0, from));
    for (let i = 0; i < slice.length; i += 20) {
      const chunk = slice.slice(i, i + 20);
      const results = await Promise.all(
        chunk.map((c) =>
          supabase
            .from("voitures")
            .update({ ordre_affichage: list.indexOf(c) + 1 })
            .eq("id", c.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) {
        setSave("error");
        setError(failed.error.message);
        return;
      }
    }
    setSave("saved");
  }, []);

  const commit = (next: Voiture[], from: number) => {
    setCars(next.map((c, i) => ({ ...c, ordre_affichage: i + 1 })));
    void persist(next, from);
  };

  const moveTo = (from: number, to: number) => {
    if (from < 0 || from >= cars.length || from === to) return;
    const next = [...cars];
    const [moved] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, moved);
    commit(next, Math.min(from, to));
  };

  const sendEdge = (i: number, edge: "first" | "last") => moveTo(i, edge === "first" ? 0 : cars.length - 1);

  const numberedIndex = (c: Voiture) => cars.findIndex((x) => x.id === c.id);

  const resetOrder = async () => {
    setSave("saving");
    const { error: err } = await supabase
      .from("voitures")
      .update({ ordre_affichage: null })
      .not("id", "is", null);
    if (err) {
      setSave("error");
      setError(err.message);
      return;
    }
    setCars((list) => sortCars(list.map((c) => ({ ...c, ordre_affichage: null }))));
    setSave("saved");
  };

  const pct = cars.length ? Math.round((ordered / cars.length) * 100) : 0;

  return (
    <div>
      <div className="mb-6 border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm">
            <strong className="text-brand">{ordered}</strong> / {cars.length} châssis positionnés manuellement
          </span>
          <span className="text-xs text-muted-foreground">{pct} %</span>
        </div>
        <div className="mt-2 h-1 w-full bg-border">
          <div className="h-1 bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {save === "error" && /ordre_affichage/.test(error ?? "") && (
        <div className="mb-6 border border-destructive/50 bg-destructive/5 p-4 text-xs">
          <p className="mb-2">
            La colonne <code>ordre_affichage</code> n'existe pas encore. Exécutez ce SQL dans l'éditeur
            SQL Supabase, puis rechargez cette page :
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap">{MISSING_COLUMN_SQL}</pre>
        </div>
      )}

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
        <div className="flex items-center justify-between gap-3">
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
          <button onClick={() => void resetOrder()} className="btn-ghost !py-1.5 !px-3 !text-xs">
            Réinitialiser
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Glissez une ligne pour la déplacer ; l'ordre est enregistré automatiquement et remplace le tri
        automatique du registre.
        {filtering && " Filtre actif : le glisser-déposer est désactivé, utilisez les flèches."}
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement des châssis…</p>
      ) : (
        <ul className="list-none p-0 m-0 border border-border divide-y divide-border">
          {visible.map((c) => {
            const i = numberedIndex(c);
            return (
              <li
                key={c.id}
                draggable={!filtering}
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
                className={`flex items-center gap-3 bg-surface px-3 py-2 ${
                  filtering ? "" : "cursor-grab active:cursor-grabbing"
                } ${overIdx === i ? "outline outline-1 outline-brand" : ""}`}
              >
                <span className="w-10 shrink-0 text-[0.7rem] tracking-wider text-muted-foreground">
                  {i + 1}
                </span>
                {c.cover_photo ? (
                  <img
                    src={photoUrl(c.cover_photo, { width: 120, quality: 55 }) ?? undefined}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="h-10 w-14 shrink-0 object-cover"
                  />
                ) : (
                  <span className="h-10 w-14 shrink-0 bg-muted" />
                )}
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate">
                    {displayChassis(c.chassis) || c.titre}
                  </span>
                  <span className="block truncate text-[0.7rem] text-muted-foreground">
                    {[c.annee, c.modele].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => sendEdge(i, "first")}
                    disabled={i === 0}
                    title="Envoyer en première position"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ⇈
                  </button>
                  <button
                    onClick={() => moveTo(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Monter"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveTo(i, i + 1)}
                    disabled={i >= cars.length - 1}
                    aria-label="Descendre"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => sendEdge(i, "last")}
                    disabled={i >= cars.length - 1}
                    title="Envoyer en dernière position"
                    className="px-1 text-xs text-muted-foreground hover:text-brand disabled:opacity-30"
                  >
                    ⇊
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
