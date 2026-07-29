import { useEffect, useMemo, useState } from "react";
import { supabase, type Voiture, type VoitureDetail } from "@/lib/supabase";
import { MODEL_GROUPS, sortCars } from "@/data/model-groups";
import { displayChassis } from "@/data/chassis-clean";
import { HistoryProse, wordCount } from "@/components/HistoryProse";

/**
 * Édition simple de l'historique d'un châssis dans les 3 langues.
 * Écrit directement dans voiture_details.description_fr / _en / _it.
 * L'affichage public n'est pas modifié : l'aperçu réutilise HistoryProse.
 */

type Lang = "fr" | "en" | "it";
const LANGS: { k: Lang; label: string; col: keyof VoitureDetail }[] = [
  { k: "fr", label: "Français", col: "description_fr" },
  { k: "en", label: "English", col: "description_en" },
  { k: "it", label: "Italiano", col: "description_it" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

const REASONS: Record<string, string> = {
  no_api_key: "Clé IA absente côté serveur.",
  rate_limit: "Trop de requêtes, réessayez dans un instant.",
  gateway_error: "Le service de traduction a renvoyé une erreur.",
  bad_json: "Réponse de traduction illisible.",
  incomplete: "Traduction incomplète.",
  empty_text: "Texte source vide.",
};

export function AdminHistoryEdit() {
  const [cars, setCars] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [carId, setCarId] = useState<string | null>(null);

  const [texts, setTexts] = useState<Record<Lang, string>>({ fr: "", en: "", it: "" });
  const [initial, setInitial] = useState<Record<Lang, string>>({ fr: "", en: "", it: "" });
  const [lang, setLang] = useState<Lang>("fr");
  const [detailLoading, setDetailLoading] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [pendingReview, setPendingReview] = useState<Lang[]>([]);


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

  const car = cars.find((c) => c.id === carId) ?? null;

  useEffect(() => {
    if (!carId) return;
    (async () => {
      setDetailLoading(true);
      setSave("idle");
      setError(null);
      const { data } = await supabase
        .from("voiture_details")
        .select("voiture_id, description, description_fr, description_en, description_it")
        .eq("voiture_id", carId)
        .maybeSingle();
      const d = (data as VoitureDetail | null) ?? null;
      const next: Record<Lang, string> = {
        fr: d?.description_fr ?? "",
        en: d?.description_en ?? d?.description ?? "",
        it: d?.description_it ?? "",
      };
      setTexts(next);
      setInitial(next);
      setPendingReview([]);
      setDetailLoading(false);
    })();
  }, [carId]);

  const dirty = LANGS.some((l) => texts[l.k] !== initial[l.k]);

  /** Traduit le texte de la langue `from` vers les deux autres (relecture avant sauvegarde). */
  const translateFrom = async (from: Lang): Promise<boolean> => {
    const source = texts[from].trim();
    if (!source) {
      setError("Le texte source est vide.");
      setSave("error");
      return false;
    }
    setTranslating(true);
    setError(null);
    try {
      const r = await fetch("/api/translate-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, source: from }),
      });
      const j = (await r.json()) as { ok?: boolean; reason?: string; fr?: string; en?: string; it?: string };
      if (!r.ok || !j.ok) throw new Error(REASONS[j.reason ?? ""] ?? "Traduction indisponible.");
      const targets = (["fr", "en", "it"] as Lang[]).filter((l) => l !== from);
      setTexts((t) => ({ ...t, ...Object.fromEntries(targets.map((l) => [l, (j as any)[l] as string])) }));
      setPendingReview(targets);
      setSave("idle");
      return true;
    } catch (e) {
      setError((e as Error).message);
      setSave("error");
      return false;
    } finally {
      setTranslating(false);
    }
  };

  const persist = async () => {
    if (!carId) return;
    setSave("saving");
    setError(null);
    const payload = {
      voiture_id: carId,
      description_fr: texts.fr.trim() || null,
      description_en: texts.en.trim() || null,
      description_it: texts.it.trim() || null,
    };
    const { error: err } = await supabase
      .from("voiture_details")
      .upsert(payload, { onConflict: "voiture_id" });
    if (err) {
      setSave("error");
      setError(err.message);
      return;
    }
    setInitial({ ...texts });
    setPendingReview([]);
    setSave("saved");
  };

  /**
   * Sauvegarde : si la langue saisie a changé et que les traductions n'ont pas
   * encore été générées/relues, on traduit d'abord et on demande une relecture.
   */
  const handleSave = async () => {
    if (!carId) return;
    const editedChanged = texts[lang] !== initial[lang];
    if (editedChanged && pendingReview.length === 0) {
      await translateFrom(lang);
      return; // l'utilisateur relit puis reclique sur « Enregistrer »
    }
    await persist();
  };


  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      {/* Sélection du châssis */}
      <aside className="space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un châssis…"
          className="w-full border border-border bg-surface px-3 py-2 text-sm"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-full border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Tous les modèles</option>
          {MODEL_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
        <div className="max-h-[32rem] overflow-y-auto border border-border">
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={() => setCarId(c.id)}
              className={`block w-full border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 ${
                c.id === carId ? "bg-brand/10 text-brand" : "hover:bg-surface"
              }`}
            >
              <span className="block">{displayChassis(c.chassis) || c.titre}</span>
              <span className="block text-xs text-muted-foreground">
                {[c.modele, c.annee].filter(Boolean).join(" · ")}
              </span>
            </button>
          ))}
          {visible.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Aucun résultat.</p>}
        </div>
      </aside>

      {/* Édition */}
      <section>
        {!car ? (
          <p className="text-muted-foreground">Sélectionnez un châssis pour modifier son historique.</p>
        ) : (
          <>
            <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl">
                {displayChassis(car.chassis) || car.titre}
                <span className="ml-3 text-sm text-muted-foreground">{car.modele}</span>
              </h2>
              <div className="flex items-center gap-3">
                {save === "saved" && !dirty && <span className="text-xs text-brand">Enregistré</span>}
                {save === "error" && <span className="text-xs text-destructive">{error}</span>}
                <button
                  onClick={persist}
                  disabled={!dirty || save === "saving"}
                  className="btn-brand !px-4 !py-1.5 !text-xs disabled:opacity-40"
                >
                  {save === "saving" ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </header>

            <div className="mb-4 flex gap-6 border-b border-border pb-2">
              {LANGS.map((l) => (
                <button
                  key={l.k}
                  onClick={() => setLang(l.k)}
                  className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                    lang === l.k ? "text-brand" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                  {texts[l.k] !== initial[l.k] && <span className="ml-1 text-gold">•</span>}
                </button>
              ))}
            </div>

            {detailLoading ? (
              <p className="text-muted-foreground">Chargement de l'historique…</p>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Texte source
                  </label>
                  <textarea
                    value={texts[lang]}
                    onChange={(e) => setTexts((t) => ({ ...t, [lang]: e.target.value }))}
                    rows={26}
                    spellCheck
                    className="w-full resize-y border border-border bg-surface p-3 font-mono text-[13px] leading-relaxed"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {wordCount(texts[lang])} mots · {texts[lang].length} caractères
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Aperçu du rendu
                  </label>
                  <div className="max-h-[38rem] overflow-y-auto border border-border bg-surface/50 p-4">
                    {texts[lang].trim() ? (
                      <HistoryProse text={texts[lang]} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun texte pour cette langue.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
