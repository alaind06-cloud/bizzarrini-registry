import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Nav, Footer } from "@/components/Nav";

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand">Error 404</p>
          <h1 className="mt-3 font-display text-5xl">Page introuvable</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            La page recherchée n'existe pas ou a été déplacée.
          </p>
          <div className="mt-6">
            <Link to="/" className="btn-brand">Retour au catalogue</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Un problème est survenu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Impossible de charger cette page. Réessayez ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-brand"
          >
            Réessayer
          </button>
          <a href="/" className="btn-ghost">Accueil</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Catalogue — Bizzarrini Register" },
      {
        name: "description",
        content:
          "Catalogue complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis.",
      },
      { name: "author", content: "Philippe Olczyk" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Catalogue — Bizzarrini Register" },
      { name: "twitter:title", content: "Catalogue — Bizzarrini Register" },
      { property: "og:description", content: "Catalogue complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis." },
      { name: "twitter:description", content: "Catalogue complet des 195 châssis Bizzarrini référencés. Filtrez par modèle, année ou numéro de châssis." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/41b65d5f-c552-4782-a59e-3389f34bce15/id-preview-5f1d0ad3--fc4836e6-1d01-4b29-8f2c-017e1286da53.lovable.app-1784744993309.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/41b65d5f-c552-4782-a59e-3389f34bce15/id-preview-5f1d0ad3--fc4836e6-1d01-4b29-8f2c-017e1286da53.lovable.app-1784744993309.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
