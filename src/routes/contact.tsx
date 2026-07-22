import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bizzarrini Register" },
      { name: "description", content: "Contactez Philippe Olczyk pour l'authentification, l'expertise ou l'ajout d'un châssis Bizzarrini." },
      { property: "og:title", content: "Contact — Bizzarrini Register" },
      { property: "og:description", content: "Écrivez à l'équipe du registre officiel Bizzarrini." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  message: z.string().trim().min(10, "Message trop court").max(2000),
});

function ContactPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const res = schema.safeParse({ nom, email, message });
    if (!res.success) {
      setErr(res.error.issues[0]?.message ?? "Erreur de saisie");
      return;
    }
    // Envoi email à brancher (edge function ou service tiers).
    setSent(true);
  };

  return (
    <div className="container-page py-12 md:py-20">
      <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand">Nous écrire</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">Contact</h1>
          <p className="mt-4 text-muted-foreground max-w-md">
            Pour toute demande d'authentification, d'ajout d'un châssis au registre,
            ou d'expertise sur une Bizzarrini, écrivez-nous.
          </p>
          <div className="mt-10 border-t border-border pt-6 space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Expert</p>
              <p className="mt-1 font-display text-xl">Philippe Olczyk</p>
              <p className="text-muted-foreground">Registre officiel Bizzarrini</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Réponse</p>
              <p className="mt-1 text-foreground/90">Sous 48 h ouvrées</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Objet</p>
              <p className="mt-1 text-foreground/90">Authentification · Ajout de châssis · Expertise</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 md:p-8">
          {sent ? (
            <div className="text-center py-6">
              <h2 className="font-display text-2xl">Message envoyé</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Nous vous répondrons dans les meilleurs délais.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label-field">Nom</label>
                <input className="field" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div>
                <label className="label-field">Message</label>
                <textarea className="field min-h-[160px] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
              </div>
              {err && <p className="text-sm text-brand">{err}</p>}
              <button className="btn-brand w-full">Envoyer</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
