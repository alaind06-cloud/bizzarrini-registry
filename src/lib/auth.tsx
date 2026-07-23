import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type Profil } from "./supabase";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profil: Profil | null;
  loading: boolean;
  isValide: boolean;
  isAdmin: boolean;
  refreshProfil: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfil = async (userId: string) => {
    const { data } = await supabase.from("profils").select("*").eq("id", userId).maybeSingle();
    setProfil((data as Profil) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) await loadProfil(session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await loadProfil(session.user.id);
      } else {
        setProfil(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    profil,
    loading,
    isValide: profil?.statut === "valide",
    isAdmin: !!profil?.est_admin,
    refreshProfil: async () => {
      if (session?.user) await loadProfil(session.user.id);
    },
    signOut: async () => {
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
  refreshProfil: async () => {},
  signOut: async () => {},
};

export function useAuth() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackAuth;
}
