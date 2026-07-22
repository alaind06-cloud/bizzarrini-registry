import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/valider")({
  head: () => ({
    meta: [
      { title: "Validation membre — Bizzarrini Register" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ValiderPage,
});

function ValiderPage() {
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("err");
      setMsg("Token manquant dans le lien.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/valider", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setState("ok");
        } else {
          setState("err");
          setMsg(data.error ?? "Erreur inconnue.");
        }
      } catch (e: any) {
        setState("err");
        setMsg(e?.message ?? "Erreur réseau.");
      }
    })();
  }, []);

  return (
    <div className="container-page py-20 md:py-28 text-center">
      <div className="max-w-md mx-auto">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Validation</p>
        {state === "loading" && (
          <h1 className="mt-4 font-display text-3xl">Vérification en cours…</h1>
        )}
        {state === "ok" && (
          <>
            <h1 className="mt-4 font-display text-4xl">Membre validé ✓</h1>
            <p className="mt-4 text-muted-foreground">
              L'accès a été accordé. Le membre peut désormais consulter le registre complet.
            </p>
          </>
        )}
        {state === "err" && (
          <>
            <h1 className="mt-4 font-display text-4xl">Lien invalide</h1>
            <p className="mt-4 text-muted-foreground">{msg}</p>
          </>
        )}
        <Link to="/" className="btn-ghost mt-8 inline-flex">Retour au catalogue</Link>
      </div>
    </div>
  );
}
