import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import bodoniDisplayFont from "../assets/fonts/bodoni-moda-latin-wght-normal.woff2?url";
import interBodyFont from "../assets/fonts/inter-latin-wght-normal.woff2?url";
import jetbrainsMonoFont from "../assets/fonts/jetbrains-mono-latin-wght-normal.woff2?url";
import { CRITICAL_CSS } from "../lib/critical-css";
import { reportLovableError } from "../lib/lovable-error-reporting";

import { PHOTOS_BASE_URL } from "@/lib/supabase-env";
import { SITE_URL } from "@/lib/seo";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Nav, Footer } from "@/components/Nav";

/** Origine Supabase (API) — préconnexion pour sortir du chemin critique. */
const SUPABASE_ORIGIN =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ??
  "https://darckkyqmzningzzbkhr.supabase.co";

/** Identifiant de mesure Google Analytics (clé publique). */
const GA_MEASUREMENT_ID =
  (import.meta.env?.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined) ??
  "G-EQB0Y315TC";

/** Identifiant Google Tag Manager. */
const GTM_ID = "GTM-WZFBMZN6";

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
            <Link to="/" className="btn-brand">Retour au registre</Link>
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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bizzarrini Register" },
      {
        name: "description",
        content:
          "Le registre officiel Bizzarrini : châssis documentés, archives photo, ouvrages de référence et vidéos d'époque.",
      },
      { name: "author", content: "Bizzarrini Register" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Bizzarrini Register" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Bizzarrini Register" },
      { name: "twitter:title", content: "Bizzarrini Register" },
      { property: "og:description", content: "Le registre officiel Bizzarrini : châssis documentés, archives photo, ouvrages de référence et vidéos d'époque." },
      { name: "twitter:description", content: "Le registre officiel Bizzarrini : châssis documentés, archives photo, ouvrages de référence et vidéos d'époque." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/41b65d5f-c552-4782-a59e-3389f34bce15/id-preview-5f1d0ad3--fc4836e6-1d01-4b29-8f2c-017e1286da53.lovable.app-1784744993309.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/41b65d5f-c552-4782-a59e-3389f34bce15/id-preview-5f1d0ad3--fc4836e6-1d01-4b29-8f2c-017e1286da53.lovable.app-1784744993309.png" },
      { name: "google-site-verification", content: "elihrHQuFba8ZXKMBbINktgQ3tDrMa4dKOskGVUqJyk" },
      { name: "google-site-verification", content: "MZOR3uUG9j5ZQLAw9IDaUZMeRfPtgVv8QApeWPYP13s" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: bodoniDisplayFont,
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: interBodyFont,
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: jetbrainsMonoFont,
        crossOrigin: "anonymous",
      },
      // API Supabase + bucket R2 des photos : chargés sans CORS, donc le
      // preconnect ne doit PAS porter crossorigin.
      { rel: "preconnect", href: SUPABASE_ORIGIN },
      { rel: "dns-prefetch", href: SUPABASE_ORIGIN },
      { rel: "preconnect", href: PHOTOS_BASE_URL },
      { rel: "dns-prefetch", href: PHOTOS_BASE_URL },
    ],
    scripts: [
      {
        children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
      },
      { src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`, async: true },
      {
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Bizzarrini Register",
              url: `${SITE_URL}/`,
              description:
                "Registre officiel des automobiles conçues par Giotto Bizzarrini : documentation châssis par châssis, archives et expertise.",
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "Bizzarrini Register",
              url: `${SITE_URL}/`,
              inLanguage: ["fr", "en", "it"],
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }),
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
        {/* CSS critique above-the-fold, inline */}
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        {/* Feuille de styles complète : préchargée puis appliquée sans bloquer le rendu.
            Le <link rel="stylesheet"> est injecté par script (hors arbre React) pour
            éviter tout écart d'hydratation. */}
        <link rel="preload" as="style" href={appCss} />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var h=" +
              JSON.stringify(appCss) +
              ";var l=document.createElement('link');l.rel='stylesheet';l.href=h;l.media='print';" +
              "l.onload=function(){l.media='all';l.onload=null};" +
              "document.head.appendChild(l);setTimeout(function(){l.media='all'},3000)})()",
          }}
        />

        <noscript>
          <link rel="stylesheet" href={appCss} />
        </noscript>

      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WZFBMZN6"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  return (
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
  );
}

