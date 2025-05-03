
import { supabase } from "@/integrations/supabase/client";

// Auth functions
export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      }
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (user) {
    // Fetch user profile data if needed
    const { data: profile } = await supabase
      .from('user_profiles')
      .select()
      .eq('id', user.id)
      .single();
      
    return { user: { ...user, profile }, error };
  }
  
  return { user, error };
};

// Tasks functions
export const getTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });
    
  return { data, error };
};

export const addTask = async (taskData: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();
    
  return { data, error };
};

export const updateTask = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteTask = async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Habits functions
export const getHabits = async () => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: false });
    
  return { data, error };
};

export const addHabit = async (habitData: any) => {
  const { data, error } = await supabase
    .from('habits')
    .insert(habitData)
    .select()
    .single();
    
  return { data, error };
};

export const updateHabit = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteHabit = async (id: string) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Journal functions
export const getJournalEntries = async () => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false });
    
  return { data, error };
};

export const addJournalEntry = async (entryData: any) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert(entryData)
    .select()
    .single();
    
  return { data, error };
};

export const getJournalEntry = async (id: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single();
    
  return { data, error };
};

export const updateJournalEntry = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteJournalEntry = async (id: string) => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Goals functions
export const getGoals = async () => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });
    
  return { data, error };
};

export const addGoal = async (goalData: any) => {
  const { data, error } = await supabase
    .from('goals')
    .insert(goalData)
    .select()
    .single();
    
  return { data, error };
};

export const updateGoal = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteGoal = async (id: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);
    
  return { error };
};

// AI functions
export const sendChatMessage = async (message: string, chatHistory: any[]) => {
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: { message, chatHistory }
  });
  
  return { data, error };
};

export const getAIAnalysis = async () => {
  const { data, error } = await supabase.functions.invoke('gemini-analysis');
  
  return { data, error };
};

// User settings
export const getUserSettings = async () => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single();
    
  return { data, error };
};

export const updateUserSettings = async (updates: any) => {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .select()
    .single();
    
  return { data, error };
};
