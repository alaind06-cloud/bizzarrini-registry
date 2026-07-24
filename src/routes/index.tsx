import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, photoUrl, type Voiture } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { FilterPills, type ActivePill } from "@/components/FilterPills";
import { Search } from "lucide-react";



type RegisterSearch = { m?: string; d?: string; q?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    m: typeof search.m === "string" && search.m.trim() ? search.m.trim() : undefined,
    d: typeof search.d === "string" && search.d.trim() ? search.d.trim() : undefined,
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
  }),
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
  const { m: modelQuery, d: decadeParam, q: qParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modele, setModele] = useState<string>("all");
  const annee = decadeParam ?? "all";
  const q = qParam ?? "";

  const setAnnee = (v: string) =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, d: v === "all" ? undefined : v }), replace: true });
  const setQ = (v: string) =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, q: v.trim() ? v : undefined }), replace: true });


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

  const MODEL_GROUPS: { key: string; label: string; test: (m: string) => boolean }[] = [
    { key: "iso-grifo-a3c", label: "Iso Grifo A3/C", test: (m) => /iso\s*grifo.*a3\s*\/?\s*c/i.test(m) || /^a3\/?c/i.test(m) },
    { key: "iso-grifo-a3l", label: "Iso Grifo A3/L", test: (m) => /iso\s*grifo.*a3\s*\/?\s*l/i.test(m) || /^a3\/?l/i.test(m) },
    { key: "iso-grifo", label: "Iso Grifo", test: (m) => /iso\s*grifo/i.test(m) },
    { key: "5300-gt", label: "5300 GT", test: (m) => /5300\s*gt/i.test(m) },
    { key: "america", label: "America", test: (m) => /\bamerica\b/i.test(m) },
    { key: "europa", label: "Europa", test: (m) => /\beuropa\b/i.test(m) },
    { key: "p538", label: "P538", test: (m) => /p\s*538/i.test(m) },
    { key: "amx3", label: "AMX/3", test: (m) => /amx\s*\/?\s*3/i.test(m) },
    { key: "1900", label: "1900", test: (m) => /\b1900\b/i.test(m) },
    { key: "manta", label: "Manta", test: (m) => /\bmanta\b/i.test(m) },
    { key: "gt-strada", label: "GT Strada", test: (m) => /gt\s*strada/i.test(m) },
    { key: "bz2000", label: "BZ 2000", test: (m) => /bz\s*2000|barchetta/i.test(m) },
  ];

  const availableGroups = useMemo(() => {
    return MODEL_GROUPS.filter((g) => voitures.some((v) => v.modele && g.test(v.modele)));
  }, [voitures]);

  const selectedGroup = availableGroups.find((g) => g.key === modele);

  const decennies = useMemo(() => {
    const set = new Set<number>();
    voitures.forEach((v) => v.annee && set.add(Math.floor(v.annee / 10) * 10));
    return Array.from(set).sort();
  }, [voitures]);

  const filtered = useMemo(() => {
    const mq = modelQuery?.toLowerCase() ?? "";
    return voitures.filter((v) => {
      if (selectedGroup && !(v.modele && selectedGroup.test(v.modele))) return false;
      if (mq && !(v.modele ?? "").toLowerCase().includes(mq)) return false;
      if (annee !== "all") {
        const dec = parseInt(annee, 10);
        if (!v.annee || v.annee < dec || v.annee >= dec + 10) return false;
      }
      if (q.trim() && !(v.chassis ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [voitures, selectedGroup, annee, q, modelQuery]);


  const clearM = () =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, m: undefined }), replace: true });

  const activePills: ActivePill[] = [];
  if (modele !== "all") {
    activePills.push({
      key: "modele",
      label: t("home.filter.model"),
      value: modele,
      onRemove: () => setModele("all"),
    });
  }
  if (modelQuery) {
    activePills.push({
      key: "m",
      label: t("home.filter.model"),
      value: modelQuery,
      onRemove: clearM,
    });
  }
  if (annee !== "all") {
    activePills.push({
      key: "annee",
      label: t("home.filter.decade"),
      value: `${annee}s`,
      onRemove: () => setAnnee("all"),
    });
  }
  if (q.trim()) {
    activePills.push({
      key: "q",
      label: t("home.filter.search"),
      value: q.trim(),
      onRemove: () => setQ(""),
    });
  }

  useEffect(() => setPage(1), [modele, annee, q, modelQuery]);


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

      <section id="registre" className="border-b border-border bg-background">
        <div className="container-page pt-8 pb-5">
          {/* Search field */}
          <div className="max-w-md">
            <label htmlFor="filter-search" className="label-field">
              {t("home.filter.search")}
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70"
              />
              <input
                id="filter-search"
                className="field-underline pl-6"
                placeholder={t("home.filter.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {/* Model pills */}
          <div className="mt-8">
            <span className="label-field block mb-3">{t("home.filter.model")}</span>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={modele === "all"} onClick={() => setModele("all")}>
                {t("home.filter.allModels")}
              </FilterChip>
              {availableGroups.map((g) => (
                <FilterChip key={g.key} active={modele === g.key} onClick={() => setModele(g.key)}>
                  {g.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Decade pills */}
          <div className="mt-6">
            <span className="label-field block mb-3">{t("home.filter.decade")}</span>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={annee === "all"} onClick={() => setAnnee("all")}>
                {t("home.filter.allDecades")}
              </FilterChip>
              {decennies.map((d) => (
                <FilterChip key={d} active={annee === String(d)} onClick={() => setAnnee(String(d))}>
                  {d}s
                </FilterChip>
              ))}
            </div>
          </div>


          {/* Row 2: pills + single elegant count */}
          {(activePills.length > 0 || !loading) && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <FilterPills pills={activePills} />
              <p
                className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground ml-auto"
                aria-live="polite"
                aria-atomic="true"
              >
                {loading ? "…" : t("home.chassisCountLong", { n: filtered.length })}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex items-baseline justify-end mb-6">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
            {loading ? (
              <span className="inline-block w-24 h-3 bg-muted rounded animate-pulse" aria-hidden="true" />
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.22em] bg-brand text-brand-foreground border border-brand shadow-sm transition-colors"
          : "inline-flex items-center px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.22em] bg-surface/40 text-foreground/70 border border-border hover:border-brand hover:text-brand transition-colors"
      }
    >
      {children}
    </button>
  );
}

function CarCard({ v, canAccess }: { v: Voiture; canAccess: boolean }) {

  const { t } = useI18n();
  const cover = photoUrl(v.cover_photo);
  const slug = (v.chassis ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const href = canAccess && slug ? { to: "/chassis/$slug", params: { slug } } : { to: "/auth" };

  // Strip model/year echo from the title to avoid repetition on the card
  const rawTitle = (v.titre ?? "").trim();
  const modelUp = (v.modele ?? "").trim();
  const yearStr = v.annee ? String(v.annee) : "";
  let cleanTitle = rawTitle;
  if (modelUp) {
    cleanTitle = cleanTitle.replace(new RegExp(`^\\s*${modelUp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-·:]?\\s*`, "i"), "");
  }
  if (yearStr) {
    cleanTitle = cleanTitle.replace(new RegExp(`(^|\\s)${yearStr}(\\s|$)`), " ").trim();
  }
  cleanTitle = cleanTitle.replace(/\s{2,}/g, " ").trim();
  const showTitle = cleanTitle && cleanTitle.toLowerCase() !== modelUp.toLowerCase();

  return (
    <Link
      {...(href as any)}
      className="group block"
    >
      <div className="art-frame">
        <div className="aspect-[4/3] bg-surface-2 relative overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={v.titre}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground text-xs uppercase tracking-widest">
              {t("card.noPhoto")}
            </div>
          )}
          {!canAccess && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground bg-background/90 border border-border px-3 py-1.5">
                {t("card.membersOnly")}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="pt-4 px-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {v.modele ?? "Bizzarrini"}{v.annee ? ` · ${v.annee}` : ""}
        </p>
        {showTitle && (
          <h3 className="mt-2 font-display text-[17px] leading-snug line-clamp-2 text-foreground">
            {cleanTitle}
          </h3>
        )}
        {v.chassis && (
          <div className="mt-3">
            <span className="chassis-plaque">
              <span className="text-muted-foreground">N°</span>
              <span>{v.chassis}</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function CarCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="art-frame">
        <div className="aspect-[4/3] bg-surface-2 animate-pulse" />
      </div>
      <div className="pt-4 px-1 space-y-3">
        <div className="h-2.5 w-1/3 bg-muted rounded-sm animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded-sm animate-pulse" />
        <div className="h-5 w-24 bg-muted rounded-sm animate-pulse" />
      </div>
    </div>
  );
}
