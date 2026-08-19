import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, SITE_MARQUE, type Profil } from "./supabase-env";

/** Statut de la demande d'accès de l'utilisateur pour la marque de ce site. */
export type DemandeStatut = "aucune" | "en_attente" | "valide" | "refuse";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profil: Profil | null;
  loading: boolean;
  isValide: boolean;
  isAdmin: boolean;
  demandeStatut: DemandeStatut;
  refreshProfil: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [demandeStatut, setDemandeStatut] = useState<DemandeStatut>("aucune");
  const [loading, setLoading] = useState(true);

  const loadProfil = async (userId: string) => {
    const supabase = await getSupabase();
    const [{ data }, { data: demande }] = await Promise.all([
      supabase.from("profils").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("demandes_acces")
        .select("statut")
        .eq("user_id", userId)
        .eq("marque", SITE_MARQUE)
        .maybeSingle(),
    ]);
    setProfil((data as Profil) ?? null);
    setDemandeStatut(((demande as { statut?: DemandeStatut } | null)?.statut as DemandeStatut) ?? "aucune");
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(session);
        if (session?.user) await loadProfil(session.user.id);
        setLoading(false);
      }

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await loadProfil(session.user.id);
        } else {
          setProfil(null);
          setDemandeStatut("aucune");
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      if (cancelled) unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    profil,
    loading,
    isValide: demandeStatut === "valide" || !!profil?.est_admin,
    isAdmin: !!profil?.est_admin,
    demandeStatut,
    refreshProfil: async () => {
      if (session?.user) await loadProfil(session.user.id);
    },
    signOut: async () => {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const fallbackAuth: AuthCtx = {
  session: null,
  user: null,
  profil: null,
  loading: true,
  isValide: false,
  isAdmin: false,
  demandeStatut: "aucune",
  refreshProfil: async () => {},
  signOut: async () => {},
};

export function useAuth() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackAuth;
}
