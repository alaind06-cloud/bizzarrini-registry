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
    <div className={`inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] ${className}`}>
      {langs.map(({ code, label }, i) => (
        <span key={code} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground/40">·</span>}
          <button
            onClick={() => setLang(code)}
            className={`px-1 py-0.5 transition-colors ${
              lang === code
                ? "text-brand"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={lang === code}
            aria-label={code === "fr" ? "Français" : code === "en" ? "English" : "Italiano"}
          >
            {label}
          </button>
        </span>
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

  const activeCls = "text-brand after:w-full after:left-0";

  const navItems: { to: string; label: string; exact?: boolean }[] = [
    { to: "/", label: t("nav.home"), exact: true },
    { to: "/giotto-bizzarrini", label: t("nav.giotto") },
    { to: "/videos", label: t("nav.videos") },
    { to: "/books", label: t("nav.books") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      {/* Top strip: language + auth (discreet) */}
      <div className="border-b border-border/60">
        <div className="container-page flex items-center justify-between py-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="hidden sm:inline">Registre officiel · dep. 1996</span>
          <div className="flex items-center gap-4 ml-auto">
            <LangSwitch />
            <span className="text-border">|</span>
            {user ? (
              <button onClick={handleLogout} className="hover:text-brand transition-colors">
                {t("nav.logout")}
              </button>
            ) : (
              <Link to="/auth" className="hover:text-brand transition-colors">
                {t("nav.signin")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Centered logo */}
      <div className="container-page pt-6 pb-3 flex items-center justify-between md:justify-center relative">
        <Link to="/" className="flex flex-col items-center group text-center">
          <span className="font-display text-2xl md:text-[28px] leading-none tracking-[0.02em]">
            Bizzarrini
          </span>
          <span className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.42em] text-muted-foreground">
            <span className="inline-block h-px w-6 bg-border" />
            <span className="text-brand">Register</span>
            <span className="inline-block h-px w-6 bg-border" />
          </span>
        </Link>

        <button
          className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 text-foreground/70 hover:text-foreground"
          aria-label={t("nav.menu")}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Nav row */}
      <nav className="hidden md:flex items-center justify-center gap-10 pb-5 pt-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="nav-link"
            activeProps={{ className: activeCls }}
            activeOptions={item.exact ? { exact: true } : undefined}
          >
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <Link to="/admin" className="nav-link" activeProps={{ className: activeCls }}>
            {t("nav.admin")}
          </Link>
        )}
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-page flex flex-col py-3">
            {navItems.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-[11px] uppercase tracking-[0.25em] text-foreground/80 hover:text-brand border-b border-border/60 last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-3 text-[11px] uppercase tracking-[0.25em] text-foreground/80"
              >
                {t("nav.admin")}
              </Link>
            )}
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
      <div className="container-page py-10 flex flex-col items-center gap-3 text-center">
        <span className="font-display text-lg tracking-wide">
          Bizzarrini <span className="text-brand">Register</span>
        </span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block h-px w-8 bg-border" />
          <p className="text-[10px] uppercase tracking-[0.35em]">{t("footer.tagline")}</p>
          <span className="inline-block h-px w-8 bg-border" />
        </div>
        <p className="text-xs text-muted-foreground">{t("footer.rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
