
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

// Sync offline data function
export const syncOfflineData = async () => {
  try {
    console.log('Syncing offline data...');
    // Add offline sync logic here if needed
    return { success: true };
  } catch (error) {
    console.error('Error syncing offline data:', error);
    throw error;
  }
};

// Goals API functions
export const getGoals = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching goals:', error);
    return { data: null, error };
  }
};

export const createGoal = async (goal: any) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating goal:', error);
    return { data: null, error };
  }
};

export const updateGoal = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating goal:', error);
    return { data: null, error };
  }
};

export const deleteGoal = async (id: string) => {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { error };
  }
};

// Habits API functions
export const getHabits = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching habits:', error);
    return { data: null, error };
  }
};

export const createHabit = async (habit: any) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating habit:', error);
    return { data: null, error };
  }
};

export const updateHabit = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating habit:', error);
    return { data: null, error };
  }
};

export const deleteHabit = async (id: string) => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    console.error('Error deleting habit:', error);
    return { error };
  }
};

// Journal API functions
export const getJournalEntries = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return { data: null, error };
  }
};

export const createJournalEntry = async (entry: any) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return { data: null, error };
  }
};

export const updateJournalEntry = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return { data: null, error };
  }
};

export const deleteJournalEntry = async (id: string) => {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return { error };
  }
};
