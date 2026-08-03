import { canonical } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bizzarrini Register" },
      { name: "description", content: "Contactez le registre pour l'authentification, l'expertise ou l'ajout d'un châssis Bizzarrini." },
      { property: "og:title", content: "Contact — Bizzarrini Register" },
      { property: "og:description", content: "Écrivez à l'équipe du registre officiel Bizzarrini." },
      { property: "og:url", content: canonical("/contact") },
    ],
    links: [{ rel: "canonical", href: canonical("/contact") }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const schema = z.object({
    nom: z.string().trim().min(1, t("contact.err.nom")).max(100),
    email: z.string().trim().email(t("contact.err.email")).max(255),
    message: z.string().trim().min(10, t("contact.err.message")).max(2000),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const res = schema.safeParse({ nom, email, message });
    if (!res.success) {
      setErr(res.error.issues[0]?.message ?? "");
      return;
    }
    setSent(true);
  };

  return (
    <div className="container-page py-12 md:py-20">
      <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("contact.kicker")}</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("contact.title")}</h1>
          <p className="mt-4 text-muted-foreground max-w-md">{t("contact.lead")}</p>
          <div className="mt-10 border-t border-border pt-6 space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("contact.expert")}</p>
              <p className="mt-1 font-display text-xl">{t("contact.expertName")}</p>
              <p className="text-muted-foreground">{t("contact.expertSubtitle")}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Email</p>
              <a
                href="mailto:registerbizz@gmail.com"
                className="mt-1 inline-block text-foreground/90 transition-colors hover:text-brand"
              >
                registerbizz@gmail.com
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("contact.response")}</p>
              <p className="mt-1 text-foreground/90">{t("contact.responseValue")}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("contact.subject")}</p>
              <p className="mt-1 text-foreground/90">{t("contact.subjectValue")}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 md:p-8">
          {sent ? (
            <div className="text-center py-6">
              <h2 className="font-display text-2xl">{t("contact.sentTitle")}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{t("contact.sentText")}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label-field">{t("contact.field.nom")}</label>
                <input className="field" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="label-field">{t("contact.field.email")}</label>
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div>
                <label className="label-field">{t("contact.field.message")}</label>
                <textarea className="field min-h-[160px] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
              </div>
              {err && <p className="text-sm text-brand">{err}</p>}
              <button className="btn-brand w-full">{t("contact.submit")}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
