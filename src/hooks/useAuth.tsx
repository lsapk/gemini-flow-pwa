
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  photo_url?: string;
  bio?: string;
}

interface AuthState {
  user: (User & { profile?: UserProfile }) | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, displayName: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session) {
        // If there's a session, get the user
        try {
          // Fetch user profile if user exists
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setAuthState({
            user: { ...session.user, profile },
            session,
            loading: false,
          });
        } catch (error) {
          console.error("Error fetching profile:", error);
          setAuthState({
            user: session.user,
            session,
            loading: false,
          });
        }
      } else {
        // If signed out, clear the user
        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      }
    });
    
    // Then check if there's an existing session
    const initAuth = async () => {
      try {
        // Check if there's a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Fetch user profile if user exists
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setAuthState({
            user: { ...session.user, profile },
            session,
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      }
    };

    initAuth();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      
      return { data: response.data, error: response.error };
    } catch (error: any) {
      console.error("Sign up failed:", error);
      return { data: null, error };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { data: response.data, error: response.error };
    } catch (error: any) {
      console.error("Login failed:", error);
      return { data: null, error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Create the auth context value
  const value = {
    ...authState,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
