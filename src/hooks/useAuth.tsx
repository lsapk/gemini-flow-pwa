
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any;
    data: any;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: any;
    data: any;
  }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{
    error: any;
    data: any;
  }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null, data: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure le client Supabase
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Vérifie s'il y a déjà une session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Vérifier si l'utilisateur est administrateur
        if (session?.user) {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .single();
          
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // Vérifier à nouveau le rôle admin lorsque l'utilisateur change
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminRole();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    return { data, error };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
