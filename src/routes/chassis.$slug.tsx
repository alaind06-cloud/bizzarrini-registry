import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, photoUrl, type Voiture, type Photo, type VoitureDetail } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/chassis/$slug")({
  head: () => ({
    meta: [
      { title: "Fiche châssis — Bizzarrini Register" },
      { name: "description", content: "Galerie complète et historique d'un châssis Bizzarrini authentifié." },
      { property: "og:title", content: "Fiche châssis — Bizzarrini Register" },
      { property: "og:description", content: "Galerie et historique réservés aux membres validés." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CarDetail,
});

export function chassisToSlug(chassis: string | null | undefined): string {
  if (!chassis) return "";
  return chassis
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CarDetail() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { user, isValide, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const [voiture, setVoiture] = useState<Voiture | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [detail, setDetail] = useState<VoitureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [mode, setMode] = useState<"summary" | "full">("full");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.navigate({ to: "/auth" });
      return;
    }
    if (!isValide) return;

    (async () => {
      setLoading(true);
      // Look up by chassis (case-insensitive). Fallback: fetch all and match slug.
      let v = await supabase.from("voitures").select("*").ilike("chassis", slug).maybeSingle();
      if (!v.data) {
        const all = await supabase.from("voitures").select("*");
        const match = (all.data as Voiture[] | null)?.find((row) => chassisToSlug(row.chassis) === slug);
        v = { data: match ?? null, error: all.error } as typeof v;
      }
      if (v.error || !v.data) {
        setErr(v.error?.message ?? "not_found");
        setLoading(false);
        return;
      }
      const voitureRow = v.data as Voiture;
      const [p, d] = await Promise.all([
        supabase.from("photos").select("*").eq("voiture_id", voitureRow.id).order("ordre", { ascending: true }),
        supabase.from("voiture_details").select("*").eq("voiture_id", voitureRow.id).maybeSingle(),
      ]);
      if (p.error) {
        setErr(p.error.message);
      } else {
        setVoiture(voitureRow);
        setPhotos((p.data as Photo[]) ?? []);
        setDetail((d.data as VoitureDetail) ?? null);
      }
      setLoading(false);
    })();
  }, [slug, user, isValide, authLoading, router]);

  const description = pickDescription(detail, lang);
  const specs = useMemo(() => extractSpecs(description ?? ""), [description]);

  if (authLoading || (user && isValide && loading)) {
    return <div className="container-page py-20 text-center text-muted-foreground">{t("car.loading")}</div>;
  }

  if (user && !isValide) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">{t("car.access.reserved")}</h1>
        <p className="mt-3 text-muted-foreground">{t("car.access.pending")}</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">{t("car.access.back")}</Link>
      </div>
    );
  }

  if (err || !voiture) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl">{t("car.notFound")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{err && err !== "not_found" ? err : t("car.notFoundText")}</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">{t("car.access.back")}</Link>
      </div>
    );
  }

  const cover = photoUrl(voiture.cover_photo);
  const specLabels: Record<SpecKey, string> = {
    engine: t("car.specs.engine"),
    color: t("car.specs.color"),
    gearbox: t("car.specs.gearbox"),
    bodywork: t("car.specs.bodywork"),
    registration: t("car.specs.registration"),
    interior: t("car.specs.interior"),
    engineNumber: t("car.specs.engineNumber"),
    gearboxNumber: t("car.specs.gearboxNumber"),
    coachbuilder: t("car.specs.coachbuilder"),
    condition: t("car.specs.condition"),
  };
  // Ordered pairs for a two-column grid (paired for visual balance)
  const specOrder: SpecKey[] = [
    "color", "interior",
    "engineNumber", "gearboxNumber",
    "coachbuilder", "condition",
    "engine", "gearbox",
    "bodywork", "registration",
  ];
  const specEntries = specOrder.filter((k) => specs[k]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container-page py-10 md:py-16">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {t("car.backCatalog")}
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="bg-surface-2 border border-border shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] p-2 sm:p-3">
              <div className="aspect-[3/2] bg-surface-2 overflow-hidden">

                {cover ? (
                  <img src={cover} alt={voiture.titre} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground">{t("card.noPhoto")}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">
                  {voiture.modele ?? "Bizzarrini"} {voiture.annee ? `· ${voiture.annee}` : ""}
                </p>
                <h1 className="mt-3 font-display text-3xl md:text-5xl leading-[1.1]">{voiture.titre}</h1>
                {voiture.chassis && (
                  <p className="mt-4 font-mono text-sm text-muted-foreground">
                    {t("car.chassisLabel")} · <span className="text-foreground">{voiture.chassis}</span>
                  </p>
                )}
              </div>

              {specEntries.length > 0 && (
                <div className="border border-border bg-surface/50 rounded-sm p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
                    {t("car.specs.title")}
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {specEntries.map((key) => (
                      <div key={key} className="flex flex-col gap-0.5">
                        <dt className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{specLabels[key]}</dt>
                        <dd className="text-foreground font-semibold">{specs[key]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 md:mt-10 mb-8">
          <h2 className="font-display text-2xl md:text-3xl">{t("car.history")}</h2>
          {description && description.trim() && (
            <div
              role="group"
              aria-label={t("car.specs.title")}
              className="inline-flex border border-border rounded-sm overflow-hidden text-xs"
            >
              <button
                type="button"
                onClick={() => setMode("summary")}
                aria-pressed={mode === "summary"}
                className={`px-3 py-1.5 uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background ${mode === "summary" ? "bg-brand text-brand-foreground" : "text-foreground/80 hover:text-foreground hover:bg-surface-2"}`}
              >
                {t("car.timeline.summary")}
              </button>
              <button
                type="button"
                onClick={() => setMode("full")}
                aria-pressed={mode === "full"}
                className={`px-3 py-1.5 uppercase tracking-wider border-l border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background ${mode === "full" ? "bg-brand text-brand-foreground" : "text-foreground/80 hover:text-foreground hover:bg-surface-2"}`}
              >
                {t("car.timeline.full")}
              </button>
            </div>
          )}
        </div>

        <HistoryTimeline
          description={description}
          modele={voiture.modele}
          annee={voiture.annee}
          chassis={voiture.chassis}
          mode={mode}
        />
      </section>

      {/* Gallery */}
      {photos.length > 0 && (
        <section className="container-page py-12 pb-16">
          <h2 className="font-display text-2xl md:text-3xl mb-6">{t("car.gallery")} · {photos.length} {t("car.photos")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((ph) => {
              const src = photoUrl(ph.filename)!;
              return (
                <button
                  key={ph.id}
                  onClick={() => setLightbox(src)}
                  className="aspect-square bg-surface-2 overflow-hidden group"
                >
                  <img
                    src={src}
                    alt={voiture.titre}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

type SpecKey =
  | "engine"
  | "color"
  | "gearbox"
  | "bodywork"
  | "registration"
  | "interior"
  | "engineNumber"
  | "gearboxNumber"
  | "coachbuilder"
  | "condition";

// Two families per key:
//  - labelled line: "Colour: red", "Interior: black leather"
//  - inline prose:  "Engine # 447 F 0815 RE.", 'Reg. no.: "SNK 899M"'
const SPEC_PATTERNS: Record<SpecKey, RegExp[]> = {
  engine: [/^\s*(?:engine|moteur|motore)\s*[:\-–]\s*(.+)$/im],
  color: [
    /^\s*(?:original\s+colou?r|colou?r|couleur(?:\s+d['']origine)?|colore(?:\s+originale)?)\s*[:\-–]\s*(.+)$/im,
    /\brepainted\s+((?:in\s+)?[a-zà-ÿ][\w'’\- ]{2,30})/i,
  ],
  gearbox: [/^\s*(?:gearbox|transmission|boi?te(?:\s+de\s+vitesses?)?|cambio)\s*[:\-–]\s*(.+)$/im],
  bodywork: [
    /^\s*(?:body(?:work)?|carrosserie|carrozzeria)\s*[:\-–]\s*(.+)$/im,
    /\b(alloy|aluminium|aluminum|steel|fibreglass|fiberglass|polyester)\s+bodywork\b/i,
  ],
  registration: [
    /^\s*(?:reg(?:istration)?|immatriculation|targa)\s*[:\-–]?\s*(.+)$/im,
    /\breg(?:istration)?\.?\s*(?:no\.?|number|n[°º])?\s*[:\-–]?\s*["“”'‘’]([^"“”'‘’\n]{2,30})["“”'‘’]/i,
  ],
  interior: [
    /^\s*(?:interior|int[ée]rieur|interni)\s*[:\-–]\s*(.+)$/im,
    /\b(?:interior|int[ée]rieur|interni|trim|upholstery)\s+(?:in\s+)?([a-zà-ÿ][\w'’\- ]{2,30})/i,
  ],
  engineNumber: [
    /^\s*(?:engine\s*(?:no\.?|number|n[°º]?)|n[°º]?\s*moteur|motore\s*n[°º]?|n[°º]?\s*motore)\s*[:\-–]?\s*(.+)$/im,
    /\bengine\s*(?:#|no\.?|number|n[°º])\s*[:\-–]?\s*([A-Z0-9][A-Z0-9 */]{2,30})/i,
  ],
  gearboxNumber: [
    /^\s*(?:gearbox\s*(?:no\.?|number|n[°º]?)|n[°º]?\s*bo[îi]te|cambio\s*n[°º]?|n[°º]?\s*cambio)\s*[:\-–]?\s*(.+)$/im,
    /\bgearbox\s*(?:#|no\.?|number|n[°º])\s*[:\-–]?\s*([A-Z0-9][A-Z0-9 */]{2,30})/i,
  ],
  coachbuilder: [
    /^\s*(?:coachbuilder|carrossier|carrozziere)\s*[:\-–]\s*(.+)$/im,
    /\b(?:body\s+by|coachwork\s+by|carrosserie\s+(?:de|par)|carrozzeria\s+di)\s+([A-Z][\w'’\-.& ]{2,40})/,
  ],
  condition: [/^\s*(?:condition|[ée]tat|stato)\s*[:\-–]\s*(.+)$/im],
};

// Prose-only heuristics that write into `condition` when nothing better matched.
const CONDITION_HINTS: Array<[RegExp, string]> = [
  [/\bcompletely\s+restored\b/i, "Restauré"],
  [/\bfully\s+restored\b/i, "Restauré"],
  [/\bconcours\s+restoration\b/i, "Restauré (concours)"],
  [/\bframe[- ]off\s+restoration\b/i, "Restauré (frame-off)"],
  [/\bmatching[- ]numbers\b/i, "Matching numbers"],
  [/\boriginal\s+(?:condition|specification|specs?)\b/i, "D'origine"],
  [/\bunrestored\b/i, "D'origine"],
];

function cleanValue(raw: string): string {
  let v = raw.trim();
  // Cut at sentence break or common connectors that leak into inline matches.
  v = v.split(/(?:\.\s|\s[-–—]\s|;|\bReg\b|\bregistration\b)/i)[0];
  // Strip surrounding quotes and trailing punctuation.
  v = v.replace(/^["“”'‘’(]+/, "").replace(/["“”'‘’).,;:\s]+$/g, "");
  return v.trim();
}

function extractSpecs(text: string): Partial<Record<SpecKey, string>> {
  const out: Partial<Record<SpecKey, string>> = {};
  for (const key of Object.keys(SPEC_PATTERNS) as SpecKey[]) {
    for (const re of SPEC_PATTERNS[key]) {
      const m = text.match(re);
      if (m && m[1]) {
        const cleaned = cleanValue(m[1]);
        if (cleaned.length >= 2 && cleaned.length <= 80) {
          out[key] = cleaned;
          break;
        }
      }
    }
  }
  if (!out.condition) {
    for (const [re, label] of CONDITION_HINTS) {
      if (re.test(text)) { out.condition = label; break; }
    }
  }
  return out;
}



interface TimelineEvent {
  key?: string;
  value: string;
}

interface TimelineEntry {
  year: string;
  events: TimelineEvent[];
}

function parseHistory(description: string): TimelineEntry[] {
  const lines = description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const entries: TimelineEntry[] = [];
  let current: TimelineEntry | null = null;

  const toEvent = (raw: string): TimelineEvent => {
    const colonIdx = raw.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      const key = raw.slice(0, colonIdx).trim();
      const value = raw.slice(colonIdx + 1).trim();
      if (key && value && !/\s/.test(key.slice(0, 2)) && key.length < 30) {
        return { key, value };
      }
    }
    return { value: raw };
  };

  for (const line of lines) {
    const yearMatch = line.match(/^(\d{4})\s*[:\-–]?(?:\s+|$)(.*)/);
    if (yearMatch) {
      const [, year, rest] = yearMatch;
      current = { year, events: rest.trim() ? [toEvent(rest.trim())] : [] };
      entries.push(current);
      continue;
    }

    if (current) {
      current.events.push(toEvent(line));
    } else {
      current = { year: "", events: [toEvent(line)] };
      entries.push(current);
    }
  }

  if (entries.length > 1 && entries[0].year === "") {
    const preamble = entries.shift()!;
    entries[0].events.unshift(...preamble.events);
  }

  return entries;
}

function pickDescription(d: VoitureDetail | null, lang: Lang): string | null {
  if (!d) return null;
  const primary = lang === "fr" ? d.description_fr : lang === "it" ? d.description_it : d.description_en;
  return primary ?? d.description_en ?? d.description ?? null;
}

function HistoryTimeline({
  description,
  modele,
  annee,
  chassis,
  mode,
}: {
  description?: string | null;
  modele?: string | null;
  annee?: number | null;
  chassis?: string | null;
  mode: "summary" | "full";
}) {
  const { t } = useI18n();
  const allEntries = description?.trim() ? parseHistory(description) : [];

  if (allEntries.length === 0) {
    const chassisLabel = t("car.chassisWord");
    return (
      <div className="max-w-3xl border-l-2 border-brand/60 pl-5 py-2 text-foreground/80 leading-relaxed">
        <p>
          {modele ?? "Bizzarrini"}
          {annee ? ` · ${annee}` : ""}
          {chassis ? ` · ${chassisLabel} ${chassis}` : ""}.
        </p>
        <p className="mt-3 text-sm text-muted-foreground italic">{t("car.history.fallback")}</p>
      </div>
    );
  }

  const entries =
    mode === "summary"
      ? allEntries
          .filter((e) => e.year)
          .map((e) => ({ ...e, events: e.events.slice(0, 1) }))
      : allEntries;

  return (
    <div className="relative max-w-4xl">
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border md:left-[19px]" />

      <div className="space-y-6">
        {entries.map((entry, idx) => (
          <div key={idx} className="relative pl-10 md:pl-14">
            <div className="absolute left-0 top-1.5 size-8 rounded-full bg-surface-2 border border-border grid place-items-center md:top-1 md:size-10">
              <div className="size-2.5 rounded-full bg-brand md:size-3" />
            </div>

            {entry.year ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-brand/10 text-brand font-mono text-sm tracking-wide border border-brand/20">
                {entry.year}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-surface text-muted-foreground font-mono text-sm tracking-wide border border-border">
                —
              </span>
            )}

            <div className="mt-3 space-y-2">
              {entry.events.map((event, eidx) =>
                event.key ? (
                  <div
                    key={eidx}
                    className="grid grid-cols-[minmax(90px,140px)_1fr] gap-3 items-baseline pl-1 border-l border-border/60 py-1"
                  >
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{event.key}</span>
                    <span className="text-foreground/90 leading-relaxed">{event.value}</span>
                  </div>
                ) : (
                  <p key={eidx} className="text-foreground/90 leading-relaxed pl-1 border-l border-border/60">
                    {event.value}
                  </p>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
