import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(url && key);

// Never send private data to a previous project's backend when configuration is missing.
export const supabase = createClient<Database>(
  url || "http://127.0.0.1:54321",
  key || "configuration-required",
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
    ...(!isSupabaseConfigured
      ? {
          global: {
            fetch: async () => {
              throw new Error(
                "Configurez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.",
              );
            },
          },
        }
      : {}),
  },
);
