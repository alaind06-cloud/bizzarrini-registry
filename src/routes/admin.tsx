import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AdminPhotoOrder } from "@/components/AdminPhotoOrder";
import { AdminChassisOrder } from "@/components/AdminChassisOrder";
import { AdminAddChassis } from "@/components/admin/AdminAddChassis";
import { AdminHistoryEdit } from "@/components/admin/AdminHistoryEdit";
import { AdminValidations } from "@/components/admin/AdminValidations";


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
  const [zone, setZone] = useState<"validations" | "gestion">("validations");
  const [section, setSection] = useState<"ajout" | "chassis" | "photos" | "historique">("ajout");
  const [pending, setPending] = useState<number | null>(null);


  useEffect(() => {
    if (authLoading) return;
    if (!user) router.navigate({ to: "/auth" });
  }, [user, authLoading]);

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


  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("admin.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl">{t("admin.title")}</h1>
      </header>

      {/* Deux zones distinctes : décisions à prendre / gestion du contenu */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {([
          {
            k: "validations" as const,
            title: "Validations",
            desc: "Demandes d'accès des membres",
          },
          {
            k: "gestion" as const,
            title: "Gestion",
            desc: "Châssis, ordre du registre et photos",
          },
        ]).map((z) => (
          <button
            key={z.k}
            onClick={() => setZone(z.k)}
            className={`border px-5 py-4 text-left transition-colors ${
              zone === z.k
                ? "border-brand bg-surface"
                : "border-border bg-surface/50 hover:border-foreground/30"
            }`}
          >
            <span
              className={`block text-xs uppercase tracking-[0.25em] ${
                zone === z.k ? "text-brand" : "text-muted-foreground"
              }`}
            >
              {z.title}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{z.desc}</span>
          </button>
        ))}
      </div>

      {zone === "gestion" ? (
        <>
          <div className="flex flex-wrap gap-6 mb-8 border-b border-border pb-3">
            {([
              { k: "ajout" as const, label: "Ajouter un châssis" },
              { k: "chassis" as const, label: "Ordre des châssis" },
              { k: "photos" as const, label: "Ordre & retouche des photos" },
              { k: "historique" as const, label: "Historique (FR/EN/IT)" },
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

          {section === "ajout" ? (
            <AdminAddChassis />
          ) : section === "chassis" ? (
            <AdminChassisOrder />
          ) : section === "historique" ? (
            <AdminHistoryEdit />
          ) : (
            <AdminPhotoOrder />
          )}
        </>
      ) : (
        <AdminValidations onPendingCount={setPending} />
      )}
    </div>
  );
}
