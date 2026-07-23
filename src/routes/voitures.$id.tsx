import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, photoUrl, type Voiture, type Photo, type VoitureDetail } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/voitures/$id")({
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

function CarDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user, isValide, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const [voiture, setVoiture] = useState<Voiture | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [detail, setDetail] = useState<VoitureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.navigate({ to: "/auth" });
      return;
    }
    if (!isValide) return;

    (async () => {
      setLoading(true);
      const [v, p, d] = await Promise.all([
        supabase.from("voitures").select("*").eq("id", id).maybeSingle(),
        supabase.from("photos").select("*").eq("voiture_id", id).order("ordre", { ascending: true }),
        supabase.from("voiture_details").select("*").eq("voiture_id", id).maybeSingle(),
      ]);
      if (v.error || p.error) {
        setErr(v.error?.message ?? p.error?.message ?? "Erreur");
      } else {
        setVoiture(v.data as Voiture);
        setPhotos((p.data as Photo[]) ?? []);
        setDetail((d.data as VoitureDetail) ?? null);
      }
      setLoading(false);
    })();
  }, [id, user, isValide, authLoading, router]);

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
        <p className="mt-2 text-sm text-muted-foreground">{err ?? t("car.notFoundText")}</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">{t("car.access.back")}</Link>
      </div>
    );
  }


  const cover = photoUrl(voiture.cover_photo);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container-page py-10 md:py-16">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            {t("car.backCatalog")}
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="aspect-[3/2] bg-surface-2 overflow-hidden">
              {cover ? (
                <img src={cover} alt={voiture.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">{t("card.noPhoto")}</div>
              )}
            </div>
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

          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl md:text-3xl">{t("car.history")}</h2>
        </div>

        <HistoryTimeline
          description={pickDescription(detail, lang)}
          modele={voiture.modele}
          annee={voiture.annee}
          chassis={voiture.chassis}
          lang={lang}
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

interface TimelineEntry {
  year: string;
  events: string[];
}

function parseHistory(description: string): TimelineEntry[] {
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const entries: TimelineEntry[] = [];
  let current: TimelineEntry | null = null;

  for (const line of lines) {
    // Lines that start with a 4-digit year, optionally followed by ':' or '-' or space
    const yearMatch = line.match(/^(\d{4})\s*[:\-–]?(?:\s+|$)(.*)/);
    if (yearMatch) {
      const [, year, rest] = yearMatch;
      current = { year, events: rest.trim() ? [rest.trim()] : [] };
      entries.push(current);
      continue;
    }

    // Lines where a year appears early but not at the very start (e.g. "Sold in 1981 for...")
    const inlineYearMatch = line.match(/^(.*?)\s+(\d{4})\s*[:\-–]?\s*(.*)/);
    if (inlineYearMatch && entries.find((e) => e.year === inlineYearMatch[2])) {
      // Attach to existing year if it already exists
      const existing = entries.find((e) => e.year === inlineYearMatch[2])!;
      const prefix = inlineYearMatch[1].trim();
      const suffix = inlineYearMatch[3].trim();
      const full = [prefix, suffix].filter(Boolean).join(" ").trim();
      if (full) existing.events.push(full);
      continue;
    }

    // Continuation of the current entry
    if (current) {
      current.events.push(line);
    } else {
      // Preamble before any dated entry
      current = { year: "", events: [line] };
      entries.push(current);
    }
  }

  // Merge empty-year preamble into the first dated entry if possible
  if (entries.length > 1 && entries[0].year === "") {
    const preamble = entries.shift()!;
    entries[0].events.unshift(...preamble.events);
  }

  return entries.length > 0 ? entries : [];
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
  lang,
}: {
  description?: string | null;
  modele?: string | null;
  annee?: number | null;
  chassis?: string | null;
  lang: Lang;
}) {
  const entries = description?.trim() ? parseHistory(description) : [];

  if (entries.length === 0) {
    const fallback = {
      fr: "L'historique détaillé de ce châssis est en cours de compilation par le registre. Si vous détenez des documents, photos d'époque ou informations de provenance, contactez l'expert via la page Contact.",
      en: "The detailed history of this chassis is currently being compiled by the register. If you hold documents, period photographs, or provenance information, please contact the expert via the Contact page.",
      it: "La storia dettagliata di questo telaio è in fase di compilazione da parte del registro. Se possiedi documenti, fotografie d'epoca o informazioni di provenienza, contatta l'esperto tramite la pagina Contatti.",
    }[lang];
    const chassisLabel = lang === "it" ? "telaio" : lang === "en" ? "chassis" : "châssis";
    return (
      <div className="max-w-3xl border-l-2 border-brand/60 pl-5 py-2 text-foreground/80 leading-relaxed">
        <p>
          {modele ?? "Bizzarrini"}
          {annee ? ` · ${annee}` : ""}
          {chassis ? ` · ${chassisLabel} ${chassis}` : ""}.
        </p>
        <p className="mt-3 text-sm text-muted-foreground italic">{fallback}</p>
      </div>
    );
  }


  return (
    <div className="relative max-w-4xl">
      {/* vertical rail */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border md:left-[19px]" />

      <div className="space-y-6">
        {entries.map((entry, idx) => (
          <div key={idx} className="relative pl-10 md:pl-14">
            {/* dot */}
            <div className="absolute left-0 top-1.5 size-8 rounded-full bg-surface-2 border border-border grid place-items-center md:top-1 md:size-10">
              <div className="size-2.5 rounded-full bg-brand md:size-3" />
            </div>

            {/* year badge */}
            {entry.year ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-brand/10 text-brand font-mono text-sm tracking-wide border border-brand/20">
                {entry.year}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-surface text-muted-foreground font-mono text-sm tracking-wide border border-border">
                —
              </span>
            )}

            {/* events */}
            <div className="mt-3 space-y-2">
              {entry.events.map((event, eidx) => (
                <p
                  key={eidx}
                  className="text-foreground/90 leading-relaxed pl-1 border-l border-border/60"
                >
                  {event}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
