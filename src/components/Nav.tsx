import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export function Nav() {
  const { user, isAdmin, signOut } = useAuth();
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
          <Link to="/" className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/videos" className={linkCls} activeProps={{ className: activeCls }}>Videos</Link>
          <Link to="/books" className={linkCls} activeProps={{ className: activeCls }}>Books</Link>
          <Link to="/contact" className={linkCls} activeProps={{ className: activeCls }}>Contact</Link>
          {isAdmin && (
            <Link to="/admin" className={linkCls} activeProps={{ className: activeCls }}>Admin</Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          ) : (
            <Link to="/auth" className="btn-brand">Sign in</Link>
          )}
        </div>

        <button
          className="md:hidden btn-ghost !p-2"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-page flex flex-col gap-1 py-3">
            {[
              { to: "/", label: "Home" },
              { to: "/videos", label: "Videos" },
              { to: "/books", label: "Books" },
              { to: "/contact", label: "Contact" },
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
                Admin
              </Link>
            )}
            <div className="pt-2 border-t border-border mt-2">
              {user ? (
                <button onClick={handleLogout} className="btn-ghost w-full">Logout</button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="btn-brand w-full">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container-page py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Bizzarrini Register — Philippe Olczyk</p>
        <p className="text-xs uppercase tracking-widest">Authenticated chassis registry</p>
      </div>
    </footer>
  );
}
