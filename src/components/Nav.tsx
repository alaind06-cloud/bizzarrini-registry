import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { useState } from "react";

function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; label: string }[] = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "it", label: "IT" },
  ];
  return (
    <div className={`inline-flex rounded-sm border border-border overflow-hidden text-[10px] font-mono uppercase tracking-widest ${className}`}>
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2 py-1 transition-colors ${
            lang === code
              ? "bg-brand text-brand-foreground"
              : "bg-transparent hover:bg-surface-2 text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={lang === code}
          aria-label={code === "fr" ? "Français" : code === "en" ? "English" : "Italiano"}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Nav() {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.navigate({ to: "/" });
  };

  const linkCls = "text-sm font-medium tracking-wide uppercase text-foreground/80 hover:text-brand transition-colors";
  const activeCls = "text-brand";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-page flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="inline-block w-1.5 h-6 bg-brand" aria-hidden />
          <span className="font-display text-lg md:text-xl tracking-wide">
            Bizzarrini <span className="text-brand">Register</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>{t("nav.home")}</Link>
          <Link to="/videos" className={linkCls} activeProps={{ className: activeCls }}>{t("nav.videos")}</Link>
          <Link to="/books" className={linkCls} activeProps={{ className: activeCls }}>{t("nav.books")}</Link>
          <Link to="/contact" className={linkCls} activeProps={{ className: activeCls }}>{t("nav.contact")}</Link>
          {isAdmin && (
            <Link to="/admin" className={linkCls} activeProps={{ className: activeCls }}>{t("nav.admin")}</Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LangSwitch />
          {user ? (
            <button onClick={handleLogout} className="btn-ghost">{t("nav.logout")}</button>
          ) : (
            <Link to="/auth" className="btn-brand">{t("nav.signin")}</Link>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LangSwitch />
          <button
            className="btn-ghost !p-2"
            aria-label={t("nav.menu")}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-page flex flex-col gap-1 py-3">
            {[
              { to: "/", label: t("nav.home") },
              { to: "/videos", label: t("nav.videos") },
              { to: "/books", label: t("nav.books") },
              { to: "/contact", label: t("nav.contact") },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2 px-1 text-sm uppercase tracking-wide text-foreground/80 hover:text-brand"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-2 px-1 text-sm uppercase tracking-wide text-foreground/80">
                {t("nav.admin")}
              </Link>
            )}
            <div className="pt-2 border-t border-border mt-2">
              {user ? (
                <button onClick={handleLogout} className="btn-ghost w-full">{t("nav.logout")}</button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="btn-brand w-full">{t("nav.signin")}</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container-page py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
        <p className="text-xs uppercase tracking-widest">{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
