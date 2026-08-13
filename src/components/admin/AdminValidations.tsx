import { useEffect, useMemo, useState } from "react";
import { supabase, type Profil } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

type Statut = Profil["statut"];

const MARQUE_LABEL: Record<string, string> = {
  bizzarrini: "Bizzarrini",
  "de-tomaso": "De Tomaso",
  mangusta: "Mangusta",
  "lancia-037": "Lancia 037",
};

/** Badge coloré par marque (tokens du design system Heritage Luxury). */
const MARQUE_STYLE: Record<string, string> = {
  bizzarrini: "border-brand/50 bg-brand/10 text-brand",
  "de-tomaso": "border-gold/50 bg-gold/10 text-gold",
  mangusta: "border-foreground/30 bg-foreground/5 text-foreground",
  "lancia-037": "border-border bg-muted text-muted-foreground",
};

function MarqueBadge({ marque }: { marque?: string | null }) {
  if (!marque) return <span className="text-muted-foreground">—</span>;
  const cls = MARQUE_STYLE[marque] ?? "border-border bg-muted text-muted-foreground";
  return (
    <span className={`inline-block border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] ${cls}`}>
      {MARQUE_LABEL[marque] ?? marque}
    </span>
  );
}

export function AdminValidations({ onPendingCount }: { onPendingCount?: (n: number) => void }) {
  const { t } = useI18n();
  const [profils, setProfils] = useState<Profil[]>([]);
  const [tab, setTab] = useState<Statut>("en_attente");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    if (!onPendingCount) return;
    supabase
      .from("profils")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente")
      .then(({ count }) => onPendingCount(count ?? 0));
  }, [profils]);

  const updateStatut = async (id: string, statut: Statut) => {
    setBusy(id);
    await supabase.from("profils").update({ statut }).eq("id", id);
    setBusy(null);
    load();
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return profils;
    return profils.filter((p) =>
      [p.prenom, p.nom, p.email, p.marque, MARQUE_LABEL[p.marque ?? ""] ?? ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }, [profils, q]);

  const tabs: { k: Statut; label: string }[] = [
    { k: "en_attente", label: t("admin.tab.enAttente") },
    { k: "valide", label: t("admin.tab.valide") },
    { k: "refuse", label: t("admin.tab.refuse") },
  ];

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })
      : "—";

  const statutBadge = (statut: Statut) => (
    <span
      className={`inline-block px-2 py-0.5 text-xs uppercase tracking-wider ${
        statut === "valide"
          ? "bg-brand/20 text-brand"
          : statut === "refuse"
            ? "bg-muted text-muted-foreground"
            : "bg-gold/20 text-gold"
      }`}
    >
      {t(`admin.status.${statut}`)}
    </span>
  );

  const actions = (p: Profil) => (
    <div className="flex flex-wrap gap-2">
      {p.statut !== "valide" && (
        <button
          disabled={busy === p.id}
          onClick={(e) => {
            e.stopPropagation();
            updateStatut(p.id, "valide");
          }}
          className="btn-brand !py-1.5 !px-3 !text-xs"
        >
          {t("admin.action.validate")}
        </button>
      )}
      {p.statut !== "refuse" && (
        <button
          disabled={busy === p.id}
          onClick={(e) => {
            e.stopPropagation();
            updateStatut(p.id, "refuse");
          }}
          className="btn-ghost !py-1.5 !px-3 !text-xs"
        >
          {t("admin.action.refuse")}
        </button>
      )}
    </div>
  );

  const details = (p: Profil) => (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("admin.col.phone")}</dt>
        <dd className="mt-0.5">{p.telephone ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("admin.col.email")}</dt>
        <dd className="mt-0.5 break-all">{p.email ?? "—"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("admin.col.raison")}</dt>
        <dd className="mt-0.5">{p.raison ?? "—"}</dd>
      </div>
    </dl>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-border">
        {tabs.map((tb) => (
          <button
            key={tb.k}
            onClick={() => setTab(tb.k)}
            className={`-mb-px border-b-2 px-1 py-2.5 text-sm uppercase tracking-wider transition-colors ${
              tab === tb.k ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher par nom, email ou site…"
        className="mb-6 w-full max-w-md border border-border bg-surface/50 px-3 py-2 text-sm outline-none focus:border-brand"
      />

      {loading ? (
        <p className="text-muted-foreground">{t("home.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <>
          {/* Mobile : cartes empilées */}
          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <div key={p.id} className="border border-border bg-surface/50 p-4">
                <button
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block text-sm">
                      {[p.prenom, p.nom].filter(Boolean).join(" ") || "—"}
                    </span>
                    <span className="mt-1 block break-all text-xs text-muted-foreground">{p.email ?? "—"}</span>
                    <span className="mt-2 block"><MarqueBadge marque={p.marque} /></span>
                  </span>
                  <span className="shrink-0 text-right">
                    {statutBadge(p.statut)}
                    <span className="mt-1 block text-xs text-muted-foreground">{fmtDate(p.created_at)}</span>
                  </span>
                </button>
                {openId === p.id && <div className="mt-4 border-t border-border pt-4">{details(p)}</div>}
                <div className="mt-4">{actions(p)}</div>
              </div>
            ))}
          </div>

          {/* Desktop : tableau compact */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4">{t("admin.col.name")}</th>
                  <th className="py-3 pr-4">Site</th>
                  <th className="py-3 pr-4">{t("admin.col.email")}</th>
                  <th className="py-3 pr-4">{t("admin.col.raison")}</th>
                  <th className="py-3 pr-4">{t("admin.col.date")}</th>
                  <th className="py-3 pr-4">{t("admin.col.status")}</th>
                  <th className="py-3">{t("admin.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <>
                    <tr
                      key={p.id}
                      onClick={() => setOpenId(openId === p.id ? null : p.id)}
                      className="cursor-pointer border-b border-border/60 align-top hover:bg-surface/60"
                    >
                      <td className="py-3 pr-4">{[p.prenom, p.nom].filter(Boolean).join(" ") || "—"}</td>
                      <td className="py-3 pr-4"><MarqueBadge marque={p.marque} /></td>
                      <td className="py-3 pr-4 break-all">{p.email ?? "—"}</td>
                      <td className="max-w-[14rem] py-3 pr-4">{p.raison ?? "—"}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{fmtDate(p.created_at)}</td>
                      <td className="py-3 pr-4">{statutBadge(p.statut)}</td>
                      <td className="py-3">{actions(p)}</td>
                    </tr>
                    {openId === p.id && (
                      <tr key={`${p.id}-d`} className="border-b border-border/60 bg-surface/40">
                        <td colSpan={7} className="px-4 py-4">
                          {details(p)}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
