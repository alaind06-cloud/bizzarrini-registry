import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom, prenom, telephone },
          },
        });
        if (error) throw error;
        // Notifier l'admin (fire-and-forget). Le trigger DB crée le profil.
        const userId = data.user?.id;
        if (userId) {
          // petit délai pour laisser le trigger insérer la ligne profils
          setTimeout(() => {
            fetch("/api/notify-signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profil_id: userId }),
            }).catch(() => {});
          }, 1500);
        }
        setMsg({
          type: "ok",
          text: "Inscription enregistrée. Un administrateur validera votre accès sous peu.",
        });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setMsg({ type: "ok", text: "Email de réinitialisation envoyé." });
      }
    } catch (e: any) {
      setMsg({ type: "err", text: e.message ?? "Une erreur est survenue." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page py-12 md:py-20">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">Espace membre</p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">
            {mode === "login" && "Connexion"}
            {mode === "signup" && "Demande d'accès"}
            {mode === "forgot" && "Mot de passe oublié"}
          </h1>
        </div>

        <div className="bg-card border border-border p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Prénom</label>
                    <input className="field" value={prenom} onChange={(e) => setPrenom(e.target.value)} required maxLength={80} />
                  </div>
                  <div>
                    <label className="label-field">Nom</label>
                    <input className="field" value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={80} />
                  </div>
                </div>
                <div>
                  <label className="label-field">Téléphone</label>
                  <input className="field" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} maxLength={40} />
                </div>
              </>
            )}

            <div>
              <label className="label-field">Email</label>
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="label-field">Mot de passe</label>
                <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={128} />
              </div>
            )}

            {msg && (
              <p className={`text-sm ${msg.type === "err" ? "text-brand" : "text-foreground"}`}>{msg.text}</p>
            )}

            <button type="submit" disabled={busy} className="btn-brand w-full">
              {busy ? "…" : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer un compte" : "Envoyer le lien"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-sm text-center space-y-2">
            {mode === "login" && (
              <>
                <p>Pas encore membre ?{" "}
                  <button className="text-brand hover:underline" onClick={() => { setMode("signup"); setMsg(null); }}>
                    Demander l'accès
                  </button>
                </p>
                <p>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => { setMode("forgot"); setMsg(null); }}>
                    Mot de passe oublié ?
                  </button>
                </p>
              </>
            )}
            {mode !== "login" && (
              <button className="text-brand hover:underline" onClick={() => { setMode("login"); setMsg(null); }}>
                ← Retour à la connexion
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-center text-muted-foreground">
          Accès soumis à validation par l'expert.{" "}
          <Link to="/" className="underline hover:text-foreground">Retour au catalogue</Link>
        </p>
      </div>
    </div>
  );
}
