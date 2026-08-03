import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr, type Dict } from "./i18n-fr";

export type Lang = "fr" | "en" | "it";
const LANG_KEY = "bz_lang";

/** Dictionnaires non-français chargés à la demande (hors bundle initial). */
const LOADERS: Record<Exclude<Lang, "fr">, () => Promise<Dict>> = {
  en: () => import("./i18n-en").then((m) => m.en),
  it: () => import("./i18n-it").then((m) => m.it),
};

const loaded: Partial<Record<Lang, Dict>> = { fr };

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | undefined>(undefined);

function format(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [, setTick] = useState(0);

  const ensure = (l: Lang) => {
    if (l === "fr" || loaded[l]) return;
    LOADERS[l]().then((d) => {
      loaded[l] = d;
      setTick((n) => n + 1);
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === "fr" || saved === "en" || saved === "it") {
      ensure(saved);
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    ensure(l);
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, l);
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const d = loaded[lang] ?? fr;
    return format(d[key] ?? fr[key] ?? key, vars);
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

const fallback: I18nCtx = {
  lang: "fr",
  setLang: () => {},
  t: (k, vars) => format(fr[k] ?? k, vars),
};

export function useI18n() {
  return useContext(Ctx) ?? fallback;
}
