import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setLibraryUser } from "./library";

const AuthContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({ user: null, ready: false });
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let alive = true;
    let revision = 0;
    const refresh = async () => {
      const current = ++revision;
      const { data } = await supabase.auth.getUser();
      if (!alive || current !== revision) return;
      await setLibraryUser(data.user?.id ?? null);
      if (alive && current === revision) setState({ user: data.user, ready: true });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") window.dispatchEvent(new Event("drini:recovery"));
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "INITIAL_SESSION"].includes(event)) return;
      if (event === "SIGNED_OUT") {
        ++revision;
        void setLibraryUser(null);
        setState({ user: null, ready: true });
      } else queueMicrotask(() => { void refresh(); });
      if (event !== "INITIAL_SESSION") {
        void router.invalidate();
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      }
    });
    void refresh();
    return () => { alive = false; ++revision; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAccount() { return useContext(AuthContext); }