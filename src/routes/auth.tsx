import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Bizzarrini Register" },
      { name: "description", content: "Connectez-vous ou demandez l'accès au registre Bizzarrini." },
      { property: "og:title", content: "Accès membre — Bizzarrini Register" },
      { property: "og:description", content: "Espace réservé aux membres validés du registre officiel Bizzarrini." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const router = useRouter();
  const { refreshProfil } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [raison, setRaison] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "err" | "ok"; text: string } | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfil();
        router.navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom, prenom, telephone },
          },
        });
        if (error) throw error;
        fetch("/api/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, prenom, email, telephone, raison }),
        }).catch((err) => console.warn("[notify-signup]", err));
        setMsg({ type: "ok", text: t("auth.msg.signupOk") });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setMsg({ type: "ok", text: t("auth.msg.resetOk") });
      }
    } catch (e: any) {
      setMsg({ type: "err", text: e.message ?? t("auth.msg.genericErr") });
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "login" ? t("auth.title.login") : mode === "signup" ? t("auth.title.signup") : t("auth.title.forgot");
  const submitLabel = busy ? "…" : mode === "login" ? t("auth.submit.login") : mode === "signup" ? t("auth.submit.signup") : t("auth.submit.forgot");

  return (
    <div className="container-page py-12 md:py-20">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("auth.kicker")}</p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">{title}</h1>
        </div>

        <div className="bg-card border border-border p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth-prenom" className="label-field">{t("auth.field.prenom")}</label>
                    <input id="auth-prenom" autoComplete="given-name" className="field" value={prenom} onChange={(e) => setPrenom(e.target.value)} required maxLength={80} />
                  </div>
                  <div>
                    <label htmlFor="auth-nom" className="label-field">{t("auth.field.nom")}</label>
                    <input id="auth-nom" autoComplete="family-name" className="field" value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={80} />
                  </div>
                </div>
                <div>
                  <label htmlFor="auth-tel" className="label-field">{t("auth.field.telephone")}</label>
                  <input id="auth-tel" autoComplete="tel" className="field" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} maxLength={40} />
                </div>
                <div>
                  <label htmlFor="auth-raison" className="label-field">
                    {t("auth.field.raison")} <span className="text-muted-foreground">{t("auth.field.optional")}</span>
                  </label>
                  <textarea id="auth-raison" className="field min-h-[80px]" value={raison} onChange={(e) => setRaison(e.target.value)} maxLength={500} placeholder={t("auth.field.raisonPlaceholder")} />
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="label-field">{t("auth.field.email")}</label>
              <input id="auth-email" autoComplete="email" className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>

            {mode !== "forgot" && (
              <div>
                <label htmlFor="auth-password" className="label-field">{t("auth.field.password")}</label>
                <input id="auth-password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={128} />
              </div>
            )}

            {msg && (
              <p className={`text-sm ${msg.type === "err" ? "text-brand" : "text-foreground"}`}>{msg.text}</p>
            )}

            <button type="submit" disabled={busy} className="btn-brand w-full">{submitLabel}</button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-sm text-center space-y-2">
            {mode === "login" && (
              <>
                <p>{t("auth.notMember")}{" "}
                  <button className="text-brand hover:underline" onClick={() => { setMode("signup"); setMsg(null); }}>
                    {t("auth.requestAccess")}
                  </button>
                </p>
                <p>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => { setMode("forgot"); setMsg(null); }}>
                    {t("auth.forgotPassword")}
                  </button>
                </p>
              </>
            )}
            {mode !== "login" && (
              <button className="text-brand hover:underline" onClick={() => { setMode("login"); setMsg(null); }}>
                {t("auth.backToLogin")}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-center text-muted-foreground">
          {t("auth.footer.note")}{" "}
          <Link to="/" className="underline hover:text-foreground">{t("auth.footer.backCatalog")}</Link>
        </p>
      </div>
    </div>
  );
}
