import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — Bizzarrini Register" },
      { name: "description", content: "Définir un nouveau mot de passe pour votre compte." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg({ type: "err", text: error.message });
    else {
      setMsg({ type: "ok", text: t("reset.ok") });
      setTimeout(() => router.navigate({ to: "/" }), 1500);
    }
  };

  return (
    <div className="container-page py-20">
      <div className="max-w-md mx-auto bg-card border border-border p-8">
        <h1 className="font-display text-3xl">{t("reset.title")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-field">{t("reset.field")}</label>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={128} />
          </div>
          {msg && <p className={`text-sm ${msg.type === "err" ? "text-brand" : "text-foreground"}`}>{msg.text}</p>}
          <button className="btn-brand w-full" disabled={busy}>{busy ? "…" : t("reset.submit")}</button>
        </form>
      </div>
    </div>
  );
}
