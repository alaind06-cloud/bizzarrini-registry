import { canonical } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { carSlug } from "@/lib/slug";
import { useEffect, useMemo, useState } from "react";
import { supabase, photoUrl, type Voiture } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { FilterPills, type ActivePill } from "@/components/FilterPills";
import { Search } from "lucide-react";
import { MODEL_GROUPS, sortCars, type RegistryFilters } from "@/data/model-groups";
import { displayChassis, matchesChassis } from "@/data/chassis-clean";

const heroPoster = { url: "/hero-interview-poster.jpg" };
const heroPosterMobile = { url: "/hero-interview-poster-mobile.jpg" };




type RegisterSearch = { m?: string; d?: string; q?: string; g?: string; p?: number };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    m: typeof search.m === "string" && search.m.trim() ? search.m.trim() : undefined,
    d: typeof search.d === "string" && search.d.trim() ? search.d.trim() : undefined,
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
    g: typeof search.g === "string" && search.g.trim() ? search.g.trim() : undefined,
    p: Number.isFinite(Number(search.p)) && Number(search.p) > 1 ? Math.floor(Number(search.p)) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Bizzarrini Register — Registre officiel des châssis" },
      {
        name: "description",
        content:
          "Registre complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
      { property: "og:title", content: "Bizzarrini Register — Registre officiel des châssis" },
      {
        property: "og:description",
        content: "Registre complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
      { property: "og:url", content: canonical("/") },
    ],
    links: [
      { rel: "canonical", href: canonical("/") },
      {
        rel: "preload",
        as: "image",
        href: heroPoster.url,
        imageSrcSet: `${heroPosterMobile.url} 900w, ${heroPoster.url} 1600w`,
        imageSizes: "100vw",
        fetchPriority: "high",
      },
    ],


  }),
  component: HomePage,
});

const PAGE_SIZE = 24;
const REGISTRY_SCROLL_KEY = "registry:scroll";

function HomePage() {
  const { user, isValide, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { m: modelQuery, d: decadeParam, q: qParam, g: groupParam, p: pageParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const modele = groupParam ?? "all";
  const annee = decadeParam ?? "all";
  const q = qParam ?? "";
  const page = Math.max(1, pageParam ?? 1);

  const setModele = (v: string) =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, g: v === "all" ? undefined : v, p: undefined }), replace: true, resetScroll: false });
  const setAnnee = (v: string) =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, d: v === "all" ? undefined : v, p: undefined }), replace: true, resetScroll: false });
  const setQ = (v: string) =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, q: v.trim() ? v : undefined, p: undefined }), replace: true, resetScroll: false });
  const setPage = (updater: (p: number) => number) =>
    navigate({
      search: (prev: RegisterSearch) => {
        const n = updater(Math.max(1, prev.p ?? 1));
        return { ...prev, p: n > 1 ? n : undefined };
      },
      replace: true,
      resetScroll: false,
    });



  useEffect(() => {
    (async () => {

      setLoading(true);
      const { data, error } = await supabase
        .from("voitures")
        .select("*")
        .order("id", { ascending: true });
      if (error) setErr(error.message);
      else {
        const clean = ((data as Voiture[]) ?? []).filter(
          (v) => (v.titre ?? "").trim().toUpperCase() !== "COVER" && (v.modele ?? "").trim().toUpperCase() !== "COVER",
        );
        setVoitures(sortCars(clean));
      }
      setLoading(false);
    })();
  }, []);

  // Groupes de modèles partagés avec la fiche châssis


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
      if (q.trim() && !matchesChassis(v.chassis, q)) return false;
      return true;
    });
  }, [voitures, selectedGroup, annee, q, modelQuery]);


  const clearM = () =>
    navigate({ search: (prev: RegisterSearch) => ({ ...prev, m: undefined }), replace: true, resetScroll: false });

  const activePills: ActivePill[] = [];
  if (modele !== "all") {
    activePills.push({
      key: "modele",
      label: t("home.filter.model"),
      value: selectedGroup?.label ?? modele,
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

  // Restaure la position de défilement au retour depuis une fiche châssis
  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    const saved = sessionStorage.getItem(REGISTRY_SCROLL_KEY);
    if (!saved) return;
    sessionStorage.removeItem(REGISTRY_SCROLL_KEY);
    const y = parseInt(saved, 10);
    if (!Number.isFinite(y)) return;
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
  }, [loading]);


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




  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-background min-h-[92vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroPoster.url}
            srcSet={`${heroPosterMobile.url} 900w, ${heroPoster.url} 1600w`}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="sync"
            width={1600}
            height={1000}
            className="absolute inset-0 w-full h-full object-cover opacity-60 saturate-[0.85] hero-kenburns"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/45 to-background/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/25 to-background/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_45%,var(--color-background)_100%)]" />

          {/* Center vertical accent hairline */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-brand/25 to-transparent pointer-events-none" />
        </div>

        <div className="container-page relative py-24 md:py-32 text-center">
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "0s", animationFillMode: "forwards" }}>
            <span className="vintage-badge">{t("home.hero.badge")}</span>
          </div>

          <h1
            className="mt-8 font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.02] text-shadow-hero opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.08s", animationFillMode: "forwards" }}
          >
            {t("home.title")
              .replace(/<\/?brand>/g, "")
              .split("Bizzarrini")
              .map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="text-brand font-sans font-semibold tracking-normal not-italic">Bizzarrini</span>
                  )}
                </span>
              ))}
          </h1>

          <div className="mt-10 mx-auto section-divider opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }} />

          <p
            className="mt-8 mx-auto max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.28s", animationFillMode: "forwards" }}
          >
            {t("home.lead")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.36s", animationFillMode: "forwards" }}>
            {!authLoading && !user && (
              <Link to="/auth" className="btn-brand">{t("home.cta.request")}</Link>
            )}
            {user && !isValide && (
              <div className="inline-flex items-center gap-3 rounded border border-brand/40 bg-brand/10 px-4 py-2 text-sm backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                {t("home.pending")}
              </div>
            )}
            {user && isValide && (
              <a href="#registre" className="btn-brand">{t("home.cta.catalog")}</a>
            )}
          </div>

          <a
            href="#registre"
            className="mt-16 inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-brand transition-colors opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.44s", animationFillMode: "forwards" }}
          >
            <span className="sr-only">{t("home.registryTitle")}</span>
            <span className="animate-float text-brand">▾</span>
          </a>
        </div>
      </section>


      <section id="registre" className="border-b border-border bg-background">
        <div className="container-page pt-20 pb-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl">{t("home.registryTitle")}</h2>
            <div className="mt-5 section-divider" />
          </div>


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
            : currentItems.map((v, i) => (
                <CarCard key={v.id} v={v} canAccess={canAccess} priority={i < 4} filters={{ g: modele !== "all" ? modele : undefined, m: modelQuery, d: annee !== "all" ? annee : undefined, q: q.trim() || undefined, p: page > 1 ? page : undefined }} />
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

function CarCard({ v, canAccess, filters, priority = false }: { v: Voiture; canAccess: boolean; filters: RegistryFilters; priority?: boolean }) {

  const { t } = useI18n();
  const cover = photoUrl(v.cover_photo, { width: 480 });
  const cover2x = photoUrl(v.cover_photo, { width: 900, quality: 62 });

  const slug = carSlug(v);
  const href = canAccess && slug ? { to: "/chassis/$slug", params: { slug }, search: filters } : { to: "/auth" };

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
      onClick={() => {
        if (typeof window !== "undefined") sessionStorage.setItem(REGISTRY_SCROLL_KEY, String(window.scrollY));
      }}
      className="group block"
    >
      <div className="art-frame">
        <div className="aspect-[4/3] bg-surface-2 relative overflow-hidden">
          {cover ? (
            <img
              src={cover}
              srcSet={cover2x ? `${cover} 480w, ${cover2x} 900w` : undefined}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              alt={v.titre}
              width={480}
              height={360}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "low"}
              decoding="async"
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
              <span>{displayChassis(v.chassis)}</span>
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
