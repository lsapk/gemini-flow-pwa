import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email: email.trim(), password });
const signUp = (email: string, password: string, displayName?: string) =>
  supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: { display_name: displayName?.trim() },
    },
  });
const resetPassword = (email: string) =>
  supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/update-password`,
  });
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: typeof signIn;
  signUp: typeof signUp;
  resetPassword: typeof resetPassword;
  signOut: () => Promise<{ error: Error | null }>;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const currentId = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let revision = 0;
    const acceptSession = (next: Session | null) => {
      if (!active) return;
      revision += 1;
      const id = next?.user.id ?? null;
      if (currentId.current !== id) {
        void queryClient.cancelQueries();
        queryClient.clear();
        setIsAdmin(false);
      }
      currentId.current = id;
      setSession(next);
      setIsLoading(false);
      if (id) {
        // Do not await another Supabase operation inside the auth callback.
        queueMicrotask(async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", id)
            .eq("role", "admin")
            .maybeSingle();
          if (active && currentId.current === id)
            setIsAdmin(!error && Boolean(data));
        });
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => acceptSession(next));
    const initialRevision = revision;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && revision === initialRevision)
          acceptSession(error ? null : data.session);
      })
      .catch(() => {
        if (active && revision === initialRevision) acceptSession(null);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = async () => {
    const userId = currentId.current;
    const { error } = await supabase.auth.signOut();
    if (!error) {
      try {
        if (userId) {
          localStorage.removeItem(`deepflow_ai_conversation_${userId}`);
          localStorage.removeItem(`deepflow_focus_v2_${userId}`);
        }
        sessionStorage.removeItem("deepflow_admin_mode");
      } catch {
        // Restricted browser storage must not prevent local sign-out.
      }
      currentId.current = null;
      queryClient.clear();
      setSession(null);
      setIsAdmin(false);
    }
    return { error };
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return context;
}
