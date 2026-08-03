import { createMiddleware } from "@tanstack/react-start";

/**
 * Variante paresseuse de `attachSupabaseAuth` : le SDK Supabase n'est chargé
 * qu'au moment où une server function est réellement appelée, ce qui le sort
 * du bundle JS initial (le bootstrap `src/start.ts` est toujours chargé).
 */
export const attachSupabaseAuthLazy = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { supabase } = await import("./client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
