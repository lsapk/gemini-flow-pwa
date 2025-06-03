
import { supabase } from "@/integrations/supabase/client";

const ADMIN_CODE = "DEEPFLOW_ADMIN_2024";

// Store admin mode in session storage for persistence
const ADMIN_SESSION_KEY = "deepflow_admin_mode";

export const enableAdminMode = async (code: string): Promise<boolean> => {
  if (code === ADMIN_CODE) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    return true;
  }
  return false;
};

export const isAdminModeEnabled = (): boolean => {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
};

export const disableAdminMode = (): void => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
};

export const isUserAdmin = async (): Promise<boolean> => {
  // Check if admin mode is enabled in session
  if (isAdminModeEnabled()) {
    return true;
  }

  // Fallback: check user roles in database
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
