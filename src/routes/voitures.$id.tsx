import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, photoUrl, type Voiture, type Photo, type VoitureDetail } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

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
    return <div className="container-page py-20 text-center text-muted-foreground">Chargement…</div>;
  }

  if (user && !isValide) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">Accès réservé</h1>
        <p className="mt-3 text-muted-foreground">
          Votre inscription est en attente de validation par l'expert.
        </p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">Retour au catalogue</Link>
      </div>
    );
  }

  if (err || !voiture) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl">Voiture introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{err ?? "Cette fiche n'existe pas."}</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">Retour au catalogue</Link>
      </div>
    );
  }

  const cover = voiture.cover_photo ? `/photos/${voiture.cover_photo}` : null;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container-page py-10 md:py-16">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← Catalogue
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="aspect-[3/2] bg-surface-2 overflow-hidden">
              {cover ? (
                <img src={cover} alt={voiture.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">Sans photo</div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand">
                {voiture.modele ?? "Bizzarrini"} {voiture.annee ? `· ${voiture.annee}` : ""}
              </p>
              <h1 className="mt-3 font-display text-3xl md:text-5xl leading-[1.1]">{voiture.titre}</h1>
              {voiture.chassis && (
                <p className="mt-4 font-mono text-sm text-muted-foreground">
                  Châssis · <span className="text-foreground">{voiture.chassis}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {photos.length > 0 && (
        <section className="container-page py-12">
          <h2 className="font-display text-2xl md:text-3xl mb-6">Galerie · {photos.length} photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((ph) => {
              const src = `/photos/${ph.filename}`;
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

      {/* Historique */}
      {detail?.description && (
        <section className="container-page py-8 pb-16">
          <h2 className="font-display text-2xl md:text-3xl mb-6">Historique</h2>
          <div className="prose prose-invert max-w-3xl whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {detail.description}
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
