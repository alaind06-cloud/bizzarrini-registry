import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Profil } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AdminPhotoOrder } from "@/components/AdminPhotoOrder";
import { AdminChassisOrder } from "@/components/AdminChassisOrder";

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
  const { t } = useI18n();
  const router = useRouter();
  const [profils, setProfils] = useState<Profil[]>([]);
  const [section, setSection] = useState<"membres" | "photos" | "chassis">("membres");
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
    return <div className="container-page py-20 text-center text-muted-foreground">{t("home.loading")}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">{t("admin.denied")}</h1>
        <p className="mt-3 text-muted-foreground">{t("admin.deniedText")}</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">{t("admin.back")}</Link>
      </div>
    );
  }

  const tabs: { k: Profil["statut"]; label: string }[] = [
    { k: "en_attente", label: t("admin.tab.enAttente") },
    { k: "valide", label: t("admin.tab.valide") },
    { k: "refuse", label: t("admin.tab.refuse") },
  ];

  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("admin.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl">{t("admin.title")}</h1>
      </header>

      <div className="flex gap-6 mb-8">
        {([
          { k: "membres" as const, label: "Membres" },
          { k: "photos" as const, label: "Ordre des photos" },
          { k: "chassis" as const, label: "Ordre des châssis" },
        ]).map((s) => (
          <button
            key={s.k}
            onClick={() => setSection(s.k)}
            className={`text-xs uppercase tracking-[0.2em] transition-colors ${
              section === s.k ? "text-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "chassis" ? (
        <AdminChassisOrder />
      ) : section === "photos" ? (
        <AdminPhotoOrder />
      ) : (
        <>
      <div className="flex gap-2 mb-6 border-b border-border">

        {tabs.map((tb) => (
          <button
            key={tb.k}
            onClick={() => setTab(tb.k)}
            className={`px-4 py-2.5 text-sm uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === tb.k ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("home.loading")}</p>
      ) : profils.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">{t("admin.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground text-left">
              <tr className="border-b border-border">
                <th className="py-3 pr-4">{t("admin.col.name")}</th>
                <th className="py-3 pr-4">{t("admin.col.email")}</th>
                <th className="py-3 pr-4">{t("admin.col.phone")}</th>
                <th className="py-3 pr-4">{t("admin.col.raison")}</th>
                <th className="py-3 pr-4">{t("admin.col.date")}</th>
                <th className="py-3 pr-4">{t("admin.col.status")}</th>
                <th className="py-3">{t("admin.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {profils.map((p) => (
                <tr key={p.id} className="border-b border-border/60 align-top">
                  <td className="py-3 pr-4">{[p.prenom, p.nom].filter(Boolean).join(" ") || "—"}</td>
                  <td className="py-3 pr-4 break-all">
                    {p.email ? (
                      <a href={`mailto:${p.email}`} className="hover:text-brand underline-offset-2 hover:underline">
                        {p.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4">{p.telephone ?? "—"}</td>
                  <td className="py-3 pr-4 max-w-[16rem]">{p.raison ?? "—"}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block px-2 py-0.5 text-xs uppercase tracking-wider ${
                      p.statut === "valide" ? "bg-brand/20 text-brand" :
                      p.statut === "refuse" ? "bg-muted text-muted-foreground" :
                      "bg-gold/20 text-gold"
                    }`}>{t(`admin.status.${p.statut}`)}</span>
                  </td>
                  <td className="py-3 space-x-2 whitespace-nowrap">
                    {p.statut !== "valide" && (
                      <button disabled={busy === p.id} onClick={() => updateStatut(p.id, "valide")} className="btn-brand !py-1.5 !px-3 !text-xs">
                        {t("admin.action.validate")}
                      </button>
                    )}
                    {p.statut !== "refuse" && (
                      <button disabled={busy === p.id} onClick={() => updateStatut(p.id, "refuse")} className="btn-ghost !py-1.5 !px-3 !text-xs">
                        {t("admin.action.refuse")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}
        </>
      )}
    </div>
  );
}
