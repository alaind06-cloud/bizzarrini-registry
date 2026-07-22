import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Profil } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Bizzarrini Register" },
      { name: "description", content: "Espace d'administration du registre Bizzarrini." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profils, setProfils] = useState<Profil[]>([]);
  const [tab, setTab] = useState<"en_attente" | "valide" | "refuse">("en_attente");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.navigate({ to: "/auth" });
      return;
    }
    if (!isAdmin) return;
    load();
  }, [user, isAdmin, authLoading, tab]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("statut", tab)
      .order("created_at", { ascending: false });
    setProfils((data as Profil[]) ?? []);
    setLoading(false);
  };

  const updateStatut = async (id: string, statut: Profil["statut"]) => {
    setBusy(id);
    await supabase.from("profils").update({ statut }).eq("id", id);
    setBusy(null);
    load();
  };

  if (authLoading) {
    return <div className="container-page py-20 text-center text-muted-foreground">Chargement…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">Accès refusé</h1>
        <p className="mt-3 text-muted-foreground">Cette page est réservée aux administrateurs.</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">Retour</Link>
      </div>
    );
  }

  const tabs: { k: Profil["statut"]; label: string }[] = [
    { k: "en_attente", label: "En attente" },
    { k: "valide", label: "Validés" },
    { k: "refuse", label: "Refusés" },
  ];

  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Administration</p>
        <h1 className="mt-3 font-display text-4xl">Membres</h1>
      </header>

      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-sm uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === t.k ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : profils.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">Aucun membre dans cette catégorie.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground text-left">
              <tr className="border-b border-border">
                <th className="py-3 pr-4">Nom</th>
                <th className="py-3 pr-4">Téléphone</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profils.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">{[p.prenom, p.nom].filter(Boolean).join(" ") || "—"}</td>
                  <td className="py-3 pr-4">{p.telephone ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block px-2 py-0.5 text-xs uppercase tracking-wider ${
                      p.statut === "valide" ? "bg-brand/20 text-brand" :
                      p.statut === "refuse" ? "bg-muted text-muted-foreground" :
                      "bg-gold/20 text-gold"
                    }`}>{p.statut}</span>
                  </td>
                  <td className="py-3 space-x-2">
                    {p.statut !== "valide" && (
                      <button disabled={busy === p.id} onClick={() => updateStatut(p.id, "valide")} className="btn-brand !py-1.5 !px-3 !text-xs">
                        Valider
                      </button>
                    )}
                    {p.statut !== "refuse" && (
                      <button disabled={busy === p.id} onClick={() => updateStatut(p.id, "refuse")} className="btn-ghost !py-1.5 !px-3 !text-xs">
                        Refuser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
