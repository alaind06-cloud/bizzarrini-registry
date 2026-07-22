import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, photoUrl, type Voiture } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catalogue — Bizzarrini Register" },
      {
        name: "description",
        content:
          "Catalogue complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
      { property: "og:title", content: "Catalogue — Bizzarrini Register" },
      {
        property: "og:description",
        content: "Catalogue complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
    ],
  }),
  component: HomePage,
});

const PAGE_SIZE = 24;

function HomePage() {
  const { user, isValide, loading: authLoading } = useAuth();
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
        .order("annee", { ascending: true, nullsFirst: false });
      if (error) setErr(error.message);
      else setVoitures((data as Voiture[]) ?? []);
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

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container-page py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Registro ufficiale</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05]">
            Le registre officiel<br />
            des <span className="text-brand">Bizzarrini</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
            Chaque châssis authentifié, documenté et archivé par Philippe Olczyk.
            195 voitures d'exception, galerie complète et historique réservés aux membres validés.
          </p>
          {!authLoading && !user && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="btn-brand">Demander l'accès</Link>
              <a href="#catalogue" className="btn-ghost">Voir le catalogue</a>
            </div>
          )}
          {user && !isValide && (
            <div className="mt-8 inline-flex items-center gap-3 rounded border border-brand/40 bg-brand/10 px-4 py-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              Votre inscription est en attente de validation.
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section id="catalogue" className="border-b border-border bg-surface/40">
        <div className="container-page py-6 grid gap-4 md:grid-cols-[1fr_1fr_2fr] items-end">
          <div>
            <label className="label-field">Modèle</label>
            <select className="field" value={modele} onChange={(e) => setModele(e.target.value)}>
              <option value="all">Tous les modèles</option>
              {modeles.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Décennie</label>
            <select className="field" value={annee} onChange={(e) => setAnnee(e.target.value)}>
              <option value="all">Toutes</option>
              {decennies.map((d) => <option key={d} value={d}>{d}s</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Recherche par châssis</label>
            <input className="field" placeholder="Ex. B*0222, IA3C…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container-page py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl">
            {loading ? "Chargement…" : `${filtered.length} châssis`}
          </h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Page {page} / {totalPages}
          </p>
        </div>

        {err && (
          <p className="text-sm text-brand">Erreur de chargement : {err}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentItems.map((v) => (
            <CarCard key={v.id} v={v} canAccess={canAccess} />
          ))}
          {!loading && currentItems.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-16">
              Aucune voiture ne correspond aux filtres.
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost"
            >
              ← Précédent
            </button>
            <span className="text-sm text-muted-foreground px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost"
            >
              Suivant →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function CarCard({ v, canAccess }: { v: Voiture; canAccess: boolean }) {
  const cover = photoUrl(v.cover_photo);
  const href = canAccess ? { to: "/voitures/$id", params: { id: v.id } } : { to: "/auth" };

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
            No photo
          </div>
        )}
        {!canAccess && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs uppercase tracking-[0.25em] text-foreground bg-background/80 border border-border px-3 py-1.5 rounded">
              Membres uniquement
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
