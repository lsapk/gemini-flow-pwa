
import { supabase } from "@/integrations/supabase/client";

export async function getUserSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", user.id)
    .single();
    
  if (error) {
    console.error("Error fetching user settings:", error);
    throw error;
  }
  
  return { data };
}

export async function updateUserSettings(settings: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("user_settings")
    .update(settings)
    .eq("id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
  
  return { data };
}

export async function updateUserProfile(profile: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("user_profiles")
    .update(profile)
    .eq("id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
  
  return { data };
}

export async function sendChatMessage(message: string, chatHistory: any[], userId: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ message, chatHistory, userId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error in sendChatMessage:", error);
    return { error: error.message };
  }
}

export async function getAIAnalysis(userId: string, customPrompt?: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ userId, customPrompt })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get AI analysis");
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error in getAIAnalysis:", error);
    return { error: error.message };
  }
}

// Added missing functions for Settings.tsx
export async function getUserSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
    console.error("Error fetching subscription:", error);
    throw error;
  }
  
  return { data: data || { subscribed: false } };
}

export async function getUserRoles() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error fetching user roles:", error);
    throw error;
  }
  
  return { data: data || [] };
}

export async function isUserAdmin() {
  try {
    const { data } = await getUserRoles();
    return Array.isArray(data) && data.some(role => role.role === 'admin');
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Add syncOfflineData function for main.tsx
export async function syncOfflineData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("User not authenticated, skipping sync");
      return { success: false, message: "User not authenticated" };
    }
    
    // Get offline data from local storage
    const offlineData = {
      tasks: JSON.parse(localStorage.getItem('offline_tasks') || '[]'),
      habits: JSON.parse(localStorage.getItem('offline_habits') || '[]'),
      goals: JSON.parse(localStorage.getItem('offline_goals') || '[]'),
      journal: JSON.parse(localStorage.getItem('offline_journal') || '[]'),
      focus: JSON.parse(localStorage.getItem('offline_focus') || '[]')
    };
    
    // Skip if no offline data
    if (!Object.values(offlineData).some(items => items.length > 0)) {
      return { success: true, message: "No offline data to sync" };
    }
    
    // Call the sync function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-offline-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(offlineData)
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Clear synced offline data
    localStorage.removeItem('offline_tasks');
    localStorage.removeItem('offline_habits');
    localStorage.removeItem('offline_goals');
    localStorage.removeItem('offline_journal');
    localStorage.removeItem('offline_focus');
    
    return { success: true, result };
  } catch (error) {
    console.error("Error syncing offline data:", error);
    return { success: false, error: error.message };
  }
}

// Tasks
export async function getTasks() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
  
  return { data };
}

export async function createTask(task: { title: string; description?: string; priority?: string; due_date?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        user_id: user.id,
        ...task
      }
    ])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }
  
  return { data };
}

export async function updateTask(taskId: string, updates: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }
  
  return { data };
}

export async function deleteTask(taskId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
  
  return { success: true };
}

// Habits
export async function getHabits() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching habits:", error);
    throw error;
  }
  
  return { data };
}

export async function createHabit(habit: { title: string; description?: string; frequency: string; target: number; category?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("habits")
    .insert([
      {
        user_id: user.id,
        streak: 0,
        ...habit
      }
    ])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating habit:", error);
    throw error;
  }
  
  return { data };
}

export async function updateHabit(habitId: string, updates: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("habits")
    .update(updates)
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating habit:", error);
    throw error;
  }
  
  return { data };
}

export async function deleteHabit(habitId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error deleting habit:", error);
    throw error;
  }
  
  return { success: true };
}

// Goals
export async function getGoals() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
  
  return { data };
}

export async function createGoal(goal: { title: string; description?: string; target_date?: string; category?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("goals")
    .insert([
      {
        user_id: user.id,
        completed: false,
        progress: 0,
        ...goal
      }
    ])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
  
  return { data };
}

export async function updateGoal(goalId: string, updates: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", goalId)
    .eq("user_id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
  
  return { data };
}

export async function deleteGoal(goalId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
  
  return { success: true };
}

// Journal
export async function getJournalEntries() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching journal entries:", error);
    throw error;
  }
  
  return { data };
}

export async function createJournalEntry(entry: { title: string; content: string; mood?: string; tags?: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("journal_entries")
    .insert([
      {
        user_id: user.id,
        tags: entry.tags ? entry.tags : [],
        ...entry
      }
    ])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
  
  return { data };
}

export async function updateJournalEntry(entryId: string, updates: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("journal_entries")
    .update(updates)
    .eq("id", entryId)
    .eq("user_id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
  
  return { data };
}

export async function deleteJournalEntry(entryId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
  
  return { success: true };
}

// Focus sessions
export async function getFocusSessions() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching focus sessions:", error);
    throw error;
  }
  
  return { data };
}

export async function createFocusSession(session: { title?: string; duration: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert([
      {
        user_id: user.id,
        ...session
      }
    ])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating focus session:", error);
    throw error;
  }
  
  return { data };
}

export async function updateFocusSession(sessionId: string, updates: Partial<any>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("focus_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating focus session:", error);
    throw error;
  }
  
  return { data };
}

export async function deleteFocusSession(sessionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from("focus_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error deleting focus session:", error);
    throw error;
  }
  
  return { success: true };
}

// Add missing exports for Stripe integration
export async function createCheckoutSession(planType: 'basic' | 'premium' | 'ultimate') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ 
        planType,
        userId: user.id,
        email: user.email,
        returnUrl: window.location.origin + "/settings"
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create checkout session");
    }
    
    const { url } = await response.json();
    return { url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: error.message };
  }
}

export async function createCustomerPortal() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ 
        userId: user.id,
        returnUrl: window.location.origin + "/settings"
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create customer portal");
    }
    
    const { url } = await response.json();
    return { url };
  } catch (error) {
    console.error("Error creating customer portal:", error);
    return { error: error.message };
  }
}
