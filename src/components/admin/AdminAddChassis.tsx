import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Voiture } from "@/lib/supabase";
import { displayChassis } from "@/data/chassis-clean";
import { chassisToSlug } from "@/routes/chassis.$slug";
import { MANUAL_ORDER_BASE } from "@/lib/photo-order";
import { HistoryProse } from "@/components/HistoryProse";
import { PhotoCropEditor } from "@/components/admin/PhotoCropEditor";
import { uploadPhoto } from "@/lib/photo-storage";
import {
  canvasToJpeg,
  detectCrop,
  loadOriented,
  renderEdited,
  type CropRect,
} from "@/lib/image-edit";

/**
 * Ajout guidé d'un nouveau châssis au registre, en quatre étapes :
 * identité → historique & spécifications → photos → publication.
 */

type Draft = {
  key: string;
  name: string;
  source: HTMLCanvasElement;
  crop: CropRect;
  auto: CropRect;
  rotation: number;
  thumb: string;
};

const SPEC_FIELDS = [
  { key: "engineNumber", label: "Numéro de moteur", line: "N° moteur", ph: "741373" },
  { key: "power", label: "Puissance", line: "Puissance", ph: "365 ch à 6 000 tr/min" },
  { key: "displacement", label: "Cylindrée", line: "Cylindrée", ph: "5 359 cm³" },
  { key: "bodywork", label: "Carrosserie", line: "Carrosserie", ph: "Aluminium, Drogo" },
  { key: "registration", label: "Immatriculation d'époque", line: "Immatriculation", ph: "LI 123456" },
] as const;

type SpecKey = (typeof SPEC_FIELDS)[number]["key"];

const STEPS = ["Identité", "Historique", "Photos", "Publication"];

export function AdminAddChassis() {
  const [step, setStep] = useState(0);
  const [cars, setCars] = useState<Voiture[]>([]);

  // Étape 1
  const [annee, setAnnee] = useState("");
  const [modele, setModele] = useState("");
  const [newModele, setNewModele] = useState("");
  const [chassis, setChassis] = useState("");

  // Étape 2
  const [history, setHistory] = useState("");
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // Étape 3
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Étape 4
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("voitures")
        .select("id, titre, modele, annee, chassis, cover_photo, photo_prefix, ordre_affichage")
        .eq("marque", SITE_MARQUE)
        .order("id", { ascending: true });
      setCars((data as Voiture[]) ?? []);
    })();
  }, []);

  const models = useMemo(
    () => [...new Set(cars.map((c) => (c.modele ?? "").trim()).filter(Boolean))].sort(),
    [cars],
  );

  const finalModel = (modele === "__new" ? newModele : modele).trim();
  const cleanNumber = displayChassis(chassis);
  const titre = [finalModel, cleanNumber].filter(Boolean).join(" ");
  const slug = chassisToSlug(chassis) || chassisToSlug(titre);
  const prefix = slug || "chassis";

  const slugTaken = cars.some(
    (c) => (chassisToSlug(c.chassis) || chassisToSlug(c.titre)) === slug && slug,
  );

  const step1Ok = Boolean(finalModel && chassis.trim() && annee.trim() && slug && !slugTaken);

  /** Texte final enregistré : historique + lignes « Clé : Valeur » lisibles. */
  const fullDescription = useMemo(() => {
    const lines = SPEC_FIELDS.filter((f) => (specs[f.key] ?? "").trim()).map(
      (f) => `${f.line} : ${specs[f.key].trim()}`,
    );
    return [history.trim(), lines.join("\n")].filter(Boolean).join("\n\n");
  }, [history, specs]);

  // ---------- Photos ----------

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    for (const file of list) {
      try {
        const source = await loadOriented(file);
        const auto = detectCrop(source);
        const thumb = renderEdited(source, auto, 0).toDataURL("image/jpeg", 0.5);
        setDrafts((d) => [
          ...d,
          {
            key: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            source,
            crop: auto,
            auto,
            rotation: 0,
            thumb,
          },
        ]);
      } catch (e) {
        setError(`Photo « ${file.name} » illisible : ${(e as Error).message}`);
      }
    }
  };

  useEffect(() => {
    if (!coverKey && drafts.length) setCoverKey(drafts[0].key);
  }, [drafts, coverKey]);

  const updateDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts((d) =>
      d.map((x) => {
        if (x.key !== key) return x;
        const next = { ...x, ...patch };
        next.thumb = renderEdited(next.source, next.crop, next.rotation).toDataURL("image/jpeg", 0.5);
        return next;
      }),
    );

  const moveDraft = (from: number, to: number) => {
    if (from === to || to < 0 || to >= drafts.length) return;
    setDrafts((d) => {
      const next = [...d];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  // ---------- Publication ----------

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const maxOrder = cars.reduce((m, c) => Math.max(m, c.ordre_affichage ?? 0), 0);
      const uploads: { filename: string; key: string }[] = [];

      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        setProgress(`Envoi de la photo ${i + 1} / ${drafts.length}…`);
        const blob = await canvasToJpeg(renderEdited(d.source, d.crop, d.rotation));
        const filename = `${prefix}-${String(i + 1).padStart(2, "0")}.jpg`;
        const { error: upErr } = await uploadPhoto(filename, blob);
        if (upErr) throw new Error(`Envoi de « ${filename} » : ${upErr.message}`);
        uploads.push({ filename, key: d.key });
      }

      setProgress("Création de la fiche…");
      const cover = uploads.find((u) => u.key === coverKey)?.filename ?? uploads[0]?.filename ?? null;
      const { data: inserted, error: insErr } = await supabase
        .from("voitures")
        .insert({
          marque: SITE_MARQUE,
          titre,
          modele: finalModel,
          annee: Number(annee) || null,
          chassis: chassis.trim(),
          cover_photo: cover,
          photo_prefix: prefix,
          ordre_affichage: maxOrder + 1,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error(insErr?.message ?? "Création impossible");
      const voitureId = (inserted as { id: string }).id;

      if (uploads.length) {
        setProgress("Enregistrement de la galerie…");
        const { error: phErr } = await supabase.from("photos").insert(
          uploads.map((u, i) => ({
            voiture_id: voitureId,
            filename: u.filename,
            ordre: MANUAL_ORDER_BASE + i,
          })),
        );
        if (phErr) throw new Error(phErr.message);
      }

      if (fullDescription) {
        setProgress("Enregistrement de l'historique…");
        const { error: dErr } = await supabase.from("voiture_details").insert({
          voiture_id: voitureId,
          description: fullDescription,
          description_fr: fullDescription,
        });
        if (dErr) throw new Error(dErr.message);
      }

      setProgress("");
      setPublishedSlug(slug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnnee("");
    setModele("");
    setNewModele("");
    setChassis("");
    setHistory("");
    setSpecs({});
    setDrafts([]);
    setCoverKey(null);
    setPublishedSlug(null);
    setError(null);
  };

  const input = "w-full bg-surface border border-border px-3 py-2 text-sm";
  const labelCls = "block mb-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground";

  if (publishedSlug) {
    return (
      <div className="border border-border bg-surface p-8 text-center">
        <p className="text-brand text-sm uppercase tracking-[0.25em]">Publié</p>
        <h3 className="mt-3 font-display text-2xl">{titre}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          La fiche est en ligne à l'adresse <code>/chassis/{publishedSlug}</code> et placée en fin
          de registre — l'ordre est modifiable dans « Ordre des châssis ».
        </p>
        <button onClick={reset} className="btn-brand mt-6 !text-xs">
          Ajouter un autre châssis
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Fil des étapes */}
      <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 list-none p-0 m-0">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
            <span
              className={`flex h-6 w-6 items-center justify-center border text-[0.7rem] ${
                i === step
                  ? "border-brand text-brand"
                  : i < step
                    ? "border-brand bg-brand text-background"
                    : "border-border text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={i === step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-6 border border-destructive/50 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Étape 1 — Identité */}
      {step === 0 && (
        <div className="grid gap-5 max-w-2xl">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ac-annee">Année</label>
              <input
                id="ac-annee"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                inputMode="numeric"
                placeholder="1965"
                className={input}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ac-chassis">Numéro de châssis</label>
              <input
                id="ac-chassis"
                value={chassis}
                onChange={(e) => setChassis(e.target.value)}
                placeholder="BA4 0110"
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="ac-modele">Modèle</label>
            <select
              id="ac-modele"
              value={modele}
              onChange={(e) => setModele(e.target.value)}
              className={input}
            >
              <option value="">— Choisir un modèle —</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="__new">＋ Nouveau modèle…</option>
            </select>
            {modele === "__new" && (
              <input
                value={newModele}
                onChange={(e) => setNewModele(e.target.value)}
                placeholder="Bizzarrini 5300 GT Strada"
                className={`${input} mt-2`}
              />
            )}
          </div>

          <div className="border border-border bg-surface p-4 text-xs">
            <p>
              <span className="text-muted-foreground">Numéro normalisé :</span>{" "}
              <strong>{cleanNumber || "—"}</strong>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Titre généré :</span> <strong>{titre || "—"}</strong>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Adresse :</span>{" "}
              <code>/chassis/{slug || "…"}</code>
            </p>
            {slugTaken && (
              <p className="mt-2 text-destructive">Ce châssis existe déjà dans le registre.</p>
            )}
          </div>
        </div>
      )}

      {/* Étape 2 — Historique & spécifications */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="ac-hist">Historique du châssis</label>
            <textarea
              id="ac-hist"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={16}
              placeholder={"1965 : livrée neuve à…\n1972 : vendue à…"}
              className={`${input} font-mono leading-relaxed`}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Même format que les fiches existantes : une ligne par événement, « Année : fait ».
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {SPEC_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className={labelCls} htmlFor={`ac-${f.key}`}>{f.label}</label>
                  <input
                    id={`ac-${f.key}`}
                    value={specs[f.key] ?? ""}
                    onChange={(e) => setSpecs((s) => ({ ...s, [f.key as SpecKey]: e.target.value }))}
                    placeholder={f.ph}
                    className={input}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={labelCls}>Aperçu du rendu</p>
            <div className="border border-border bg-surface p-4 max-h-[36rem] overflow-y-auto">
              {fullDescription ? (
                <HistoryProse text={fullDescription} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Saisissez l'historique pour voir l'aperçu.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Étape 3 — Photos */}
      {step === 2 && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void addFiles(e.dataTransfer.files);
            }}
            className={`border border-dashed p-10 text-center text-sm ${
              dragOver ? "border-brand bg-brand/5" : "border-border bg-surface"
            }`}
          >
            <p>Glissez vos photos ici</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Rotation EXIF et recadrage des bordures appliqués automatiquement, sans compression
              ni réduction de définition.
            </p>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost mt-4 !text-xs">
              Choisir des fichiers
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>

          {drafts.length > 0 && (
            <>
              <p className="mt-6 mb-3 text-xs text-muted-foreground">
                {drafts.length} photo{drafts.length > 1 ? "s" : ""} · glissez pour réordonner ·
                ★ désigne la photo de couverture
              </p>
              <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 list-none p-0 m-0">
                {drafts.map((d, i) => (
                  <li
                    key={d.key}
                    draggable
                    onDragStart={() => (dragIdx.current = i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIdx.current !== null) moveDraft(dragIdx.current, i);
                      dragIdx.current = null;
                    }}
                    className="relative border border-border bg-surface cursor-grab"
                    title={d.name}
                  >
                    <img src={d.thumb} alt="" className="w-full aspect-[4/3] object-cover" />
                    <span className="absolute top-1 left-1 bg-background/85 px-1.5 py-0.5 text-[0.65rem]">
                      {i + 1}
                    </span>
                    {coverKey === d.key && (
                      <span className="absolute top-1 right-1 bg-brand text-background px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider">
                        Cover
                      </span>
                    )}
                    <div className="flex items-center justify-between px-1 py-1 text-xs">
                      <button
                        onClick={() => setEditing(d.key)}
                        className="px-1 text-muted-foreground hover:text-brand"
                        title="Ajuster le recadrage"
                      >
                        ✂
                      </button>
                      <button
                        onClick={() => setCoverKey(d.key)}
                        className={`px-1 ${coverKey === d.key ? "text-brand" : "text-muted-foreground hover:text-brand"}`}
                        title="Photo de couverture"
                      >
                        ★
                      </button>
                      <button
                        onClick={() => moveDraft(i, i - 1)}
                        disabled={i === 0}
                        className="px-1 text-muted-foreground hover:text-brand disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => moveDraft(i, i + 1)}
                        disabled={i === drafts.length - 1}
                        className="px-1 text-muted-foreground hover:text-brand disabled:opacity-30"
                      >
                        →
                      </button>
                      <button
                        onClick={() => setDrafts((l) => l.filter((x) => x.key !== d.key))}
                        className="px-1 text-muted-foreground hover:text-destructive"
                        title="Retirer"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {editing && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-6">
              <div className="mx-auto max-w-5xl">
                {(() => {
                  const d = drafts.find((x) => x.key === editing);
                  if (!d) return null;
                  return (
                    <>
                      <div className="mb-4 flex items-baseline justify-between gap-4">
                        <h3 className="font-display text-xl">{d.name}</h3>
                        <button onClick={() => setEditing(null)} className="btn-brand !text-xs">
                          Valider
                        </button>
                      </div>
                      <PhotoCropEditor
                        source={d.source}
                        crop={d.crop}
                        rotation={d.rotation}
                        onChange={(n) => updateDraft(d.key, n)}
                        onReset={() => updateDraft(d.key, { crop: d.auto, rotation: 0 })}
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Étape 4 — Récapitulatif */}
      {step === 3 && (
        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
          <dl className="border border-border bg-surface p-5 text-sm space-y-2">
            {[
              ["Titre", titre],
              ["Année", annee || "—"],
              ["Modèle", finalModel],
              ["Châssis", cleanNumber],
              ["Adresse", `/chassis/${slug}`],
              ["Photos", `${drafts.length}`],
              ["Historique", `${history.trim().split(/\s+/).filter(Boolean).length} mots`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            {drafts[0] && (
              <img
                src={(drafts.find((d) => d.key === coverKey) ?? drafts[0]).thumb}
                alt=""
                className="w-full border border-border object-cover"
              />
            )}
            <button
              onClick={() => void publish()}
              disabled={publishing || !step1Ok}
              className="btn-brand mt-4 w-full !text-xs disabled:opacity-40"
            >
              {publishing ? progress || "Publication…" : "Publier le châssis"}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || publishing}
          className="btn-ghost !text-xs disabled:opacity-30"
        >
          ← Étape précédente
        </button>
        <button
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1 || (step === 0 && !step1Ok)}
          className="btn-brand !text-xs disabled:opacity-30"
        >
          Étape suivante →
        </button>
      </div>
    </div>
  );
}
