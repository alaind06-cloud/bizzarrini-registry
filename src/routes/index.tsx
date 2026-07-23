import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, photoUrl, type Voiture } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bizzarrini Register - Official Chassis Registry & Provenance | Iso Grifo, A3/C, 5300 GT" },
      {
        name: "description",
        content:
          "Registre complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
      { property: "og:title", content: "Bizzarrini Register - Official Chassis Registry & Provenance | Iso Grifo, A3/C, 5300 GT" },
      {
        property: "og:description",
        content: "Registre complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
    ],
  }),
  component: HomePage,
});

const PAGE_SIZE = 24;

function HomePage() {
  const { user, isValide, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modele, setModele] = useState<string>("all");
  const [annee, setAnnee] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("voitures")
        .select("id, titre, modele, annee, chassis, cover_photo, photo_prefix")
        .order("id", { ascending: true });
      if (error) setErr(error.message);
      else {
        const clean = ((data as Voiture[]) ?? []).filter(
          (v) => (v.titre ?? "").trim().toUpperCase() !== "COVER" && (v.modele ?? "").trim().toUpperCase() !== "COVER",
        );
        setVoitures(clean);
      }
      setLoading(false);
    })();
  }, []);

  const modeles = useMemo(
    () => Array.from(new Set(voitures.map((v) => v.modele).filter(Boolean))).sort() as string[],
    [voitures],
  );

  const decennies = useMemo(() => {
    const set = new Set<number>();
    voitures.forEach((v) => v.annee && set.add(Math.floor(v.annee / 10) * 10));
    return Array.from(set).sort();
  }, [voitures]);

  const filtered = useMemo(() => {
    return voitures.filter((v) => {
      if (modele !== "all" && v.modele !== modele) return false;
      if (annee !== "all") {
        const dec = parseInt(annee, 10);
        if (!v.annee || v.annee < dec || v.annee >= dec + 10) return false;
      }
      if (q.trim() && !(v.chassis ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [voitures, modele, annee, q]);

  useEffect(() => setPage(1), [modele, annee, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const canAccess = !!user && isValide;

  const heroCovers = useMemo(() => {
    const iconicModels = ["ISO GRIFO A3/C", "5300 GT", "P538-002", "AMX/3"];
    const picks: Voiture[] = [];
    for (const m of iconicModels) {
      const match = voitures.find((v) => v.modele === m && v.cover_photo);
      if (match) picks.push(match);
    }
    if (picks.length < 4) {
      for (const v of voitures) {
        if (picks.length >= 4) break;
        if (v.cover_photo && !picks.includes(v)) picks.push(v);
      }
    }
    return picks.slice(0, 4);
  }, [voitures]);

  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (heroCovers.length < 2) return;
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % heroCovers.length), 6000);
    return () => clearInterval(timer);
  }, [heroCovers.length]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0">
          {heroCovers.map((v, i) => (
            <div
              key={v.id}
              className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
              style={{ opacity: i === heroIdx ? 1 : 0 }}
            >
              <img
                src={photoUrl(v.cover_photo)!}
                alt=""
                aria-hidden
                className="w-full h-full object-cover hero-kenburns"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        </div>

        <div className="container-page relative py-24 md:py-36 lg:py-44">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">{t("home.kicker")}</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05]">
            {t("home.title.a")}<br />
            {t("home.title.b")} <span className="text-brand">Bizzarrini</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
            {t("home.lead")}
          </p>
          {!authLoading && !user && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="btn-brand">{t("home.cta.request")}</Link>
              <a href="#registre" className="btn-ghost">{t("home.cta.catalog")}</a>
            </div>
          )}
          {user && !isValide && (
            <div className="mt-8 inline-flex items-center gap-3 rounded border border-brand/40 bg-brand/10 px-4 py-2 text-sm backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              {t("home.pending")}
            </div>
          )}

          {heroCovers.length > 1 && (
            <div className="mt-12 flex items-center gap-2">
              {heroCovers.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  aria-current={i === heroIdx ? "true" : undefined}
                  onClick={() => setHeroIdx(i)}
                  className={`h-1 rounded-sm transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    i === heroIdx ? "w-10 bg-brand" : "w-6 bg-foreground/30 hover:bg-foreground/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="catalogue" className="border-b border-border bg-surface/40">
        <div className="container-page py-6 grid gap-4 md:grid-cols-[1fr_1fr_2fr] items-end">
          <div>
            <label htmlFor="filter-model" className="label-field">{t("home.filter.model")}</label>
            <select id="filter-model" className="field" value={modele} onChange={(e) => setModele(e.target.value)}>
              <option value="all">{t("home.filter.allModels")}</option>
              {modeles.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-decade" className="label-field">{t("home.filter.decade")}</label>
            <select id="filter-decade" className="field" value={annee} onChange={(e) => setAnnee(e.target.value)}>
              <option value="all">{t("home.filter.allDecades")}</option>
              {decennies.map((d) => <option key={d} value={d}>{d}s</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-search" className="label-field">{t("home.filter.search")}</label>
            <input id="filter-search" className="field" placeholder={t("home.filter.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl">
            {loading ? (
              <span className="inline-block w-40 h-8 bg-muted rounded animate-pulse" aria-hidden="true" />
            ) : (
              t("home.chassisCount", { n: filtered.length })
            )}
          </h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {loading ? (
              <span className="inline-block w-24 h-4 bg-muted rounded animate-pulse" aria-hidden="true" />
            ) : (
              t("home.pageOf", { p: page, t: totalPages })
            )}
          </p>
        </div>

        {err && (
          <p className="text-sm text-brand">{t("home.errorLoading", { msg: err })}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-busy={loading}>
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <CarCardSkeleton key={i} />)
            : currentItems.map((v) => (
                <CarCard key={v.id} v={v} canAccess={canAccess} />
              ))}
          {!loading && currentItems.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-16">
              {t("home.noResults")}
            </p>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost"
            >
              {t("home.prev")}
            </button>
            <span className="text-sm text-muted-foreground px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost"
            >
              {t("home.next")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function CarCard({ v, canAccess }: { v: Voiture; canAccess: boolean }) {
  const { t } = useI18n();
  const cover = photoUrl(v.cover_photo);
  const slug = (v.chassis ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const href = canAccess && slug ? { to: "/chassis/$slug", params: { slug } } : { to: "/auth" };

  return (
    <Link
      {...(href as any)}
      className="group block bg-card border border-border overflow-hidden hover:border-brand transition-colors"
    >
      <div className="aspect-[4/3] bg-surface-2 relative overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={v.titre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs uppercase tracking-widest">
            {t("card.noPhoto")}
          </div>
        )}
        {!canAccess && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs uppercase tracking-[0.25em] text-foreground bg-background/80 border border-border px-3 py-1.5 rounded">
              {t("card.membersOnly")}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-widest text-brand">{v.modele ?? "Bizzarrini"} {v.annee ? `· ${v.annee}` : ""}</p>
        <h3 className="mt-1.5 font-display text-lg leading-snug line-clamp-2">{v.titre}</h3>
        {v.chassis && <p className="mt-2 text-xs text-muted-foreground font-mono">#{v.chassis}</p>}
      </div>
    </Link>
  );
}

function CarCardSkeleton() {
  return (
    <div className="bg-card border border-border overflow-hidden" aria-hidden="true">
      <div className="aspect-[4/3] bg-surface-2 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
