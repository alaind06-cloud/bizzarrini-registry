import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getSupabase, SITE_MARQUE } from "@/lib/supabase-env";

const RAISON_MIN = 30;

/**
 * Bouton + formulaire « Demander l'accès » pour un utilisateur connecté
 * qui n'a pas encore de demande validée sur la marque de ce site.
 */
export function RequestAccess() {
  const { user, demandeStatut, refreshProfil } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [raison, setRaison] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user || demandeStatut === "valide") return null;

  if (demandeStatut === "en_attente") {
    return (
      <div className="inline-flex items-center gap-3 rounded border border-brand/40 bg-brand/10 px-4 py-2 text-sm backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
        {t("home.pending")}
      </div>
    );
  }

  const tropCourte = raison.trim().length > 0 && raison.trim().length < RAISON_MIN;

  const submit = async () => {
    if (raison.trim().length < RAISON_MIN) {
      setErr(t("auth.err.raisonTropCourte").replace("{n}", String(RAISON_MIN)));
      return;
    }
    setBusy(true);
    setErr(null);
    const supabase = await getSupabase();
    const { error } = await supabase
      .from("demandes_acces")
      .insert({ user_id: user.id, marque: SITE_MARQUE, raison: raison.trim() });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setOpen(false);
    setRaison("");
    await refreshProfil();
  };

  if (!open) {
    return (
      <button type="button" className="btn-brand" onClick={() => setOpen(true)}>
        {t("home.cta.request")}
      </button>
    );
  }

  return (
    <div className="w-full max-w-lg border border-border bg-card/90 p-5 text-left backdrop-blur">
      <label htmlFor="req-raison" className="label-field">
        {t("auth.field.raisonLibre")}
      </label>
      <textarea
        id="req-raison"
        className="field min-h-28 resize-y"
        value={raison}
        onChange={(e) => setRaison(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder={t("auth.field.raisonLibrePlaceholder")}
      />
      <p className={`mt-1 text-xs ${tropCourte ? "text-brand" : "text-muted-foreground"}`}>
        {tropCourte
          ? t("auth.err.raisonTropCourte").replace("{n}", String(RAISON_MIN))
          : `${raison.trim().length} / ${RAISON_MIN}`}
      </p>
      {err && <p className="mt-2 text-sm text-brand">{err}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" disabled={busy} onClick={submit} className="btn-brand">
          {busy ? "…" : t("home.cta.request")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
