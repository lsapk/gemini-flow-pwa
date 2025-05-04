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

// Data synchronization function for offline mode
export const syncOfflineData = async () => {
  const offlineData = localStorage.getItem('offlineData');
  
  if (!offlineData) {
    return { success: true };
  }
  
  try {
    const parsedData = JSON.parse(offlineData);
    const { tasks = [], habits = [], goals = [], journal = [] } = parsedData;
    
    // Process tasks
    for (const task of tasks) {
      if (task.id.startsWith('offline_')) {
        // This is a new task created offline
        const newTask = { ...task };
        delete newTask.id;
        await addTask(newTask);
      } else {
        // This is an existing task updated offline
        await updateTask(task.id, task);
      }
    }
    
    // Process habits
    for (const habit of habits) {
      if (habit.id.startsWith('offline_')) {
        const newHabit = { ...habit };
        delete newHabit.id;
        await addHabit(newHabit);
      } else {
        await updateHabit(habit.id, habit);
      }
    }
    
    // Process goals
    for (const goal of goals) {
      if (goal.id.startsWith('offline_')) {
        const newGoal = { ...goal };
        delete newGoal.id;
        await addGoal(newGoal);
      } else {
        await updateGoal(goal.id, goal);
      }
    }
    
    // Process journal entries
    for (const entry of journal) {
      if (entry.id.startsWith('offline_')) {
        const newEntry = { ...entry };
        delete newEntry.id;
        await addJournalEntry(newEntry);
      } else {
        await updateJournalEntry(entry.id, entry);
      }
    }
    
    // Clear offline data after successful sync
    localStorage.removeItem('offlineData');
    
    return { success: true };
  } catch (error) {
    console.error("Error syncing offline data:", error);
    return { success: false, error };
  }
};

// Helper function to store data offline
const storeOfflineData = (type: string, data: any) => {
  try {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    
    if (!offlineData[type]) {
      offlineData[type] = [];
    }
    
    // Add or update the item in offline storage
    const index = offlineData[type].findIndex((item: any) => item.id === data.id);
    
    if (index >= 0) {
      offlineData[type][index] = data;
    } else {
      offlineData[type].push(data);
    }
    
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
    return true;
  } catch (error) {
    console.error(`Error storing offline ${type}:`, error);
    return false;
  }
};

// Function to check if we're online
export const isOnline = () => {
  return navigator.onLine;
};

// Tasks functions
export const getTasks = async () => {
  if (!isOnline()) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    return { data: offlineData.tasks || [], error: null };
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });
    
  if (!error && data) {
    // Cache the data for offline use
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    offlineData.tasks = data;
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
    
  return { data, error };
};

export const addTask = async (taskData: any) => {
  if (!isOnline()) {
    const offlineId = `offline_${Date.now()}`;
    const newTask = { ...taskData, id: offlineId };
    storeOfflineData('tasks', newTask);
    return { data: newTask, error: null };
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();
    
  return { data, error };
};

export const updateTask = async (id: string, updates: any) => {
  if (!isOnline()) {
    const updatedTask = { ...updates, id };
    storeOfflineData('tasks', updatedTask);
    return { data: updatedTask, error: null };
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteTask = async (id: string) => {
  if (!isOnline()) {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData.tasks) {
      offlineData.tasks = offlineData.tasks.filter((task: any) => task.id !== id);
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    }
    return { error: null };
  }
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Habits functions
export const getHabits = async () => {
  if (!isOnline()) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    return { data: offlineData.habits || [], error: null };
  }
  
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (!error && data) {
    // Cache the data for offline use
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    offlineData.habits = data;
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
    
  return { data, error };
};

export const addHabit = async (habitData: any) => {
  if (!isOnline()) {
    const offlineId = `offline_${Date.now()}`;
    const newHabit = { ...habitData, id: offlineId };
    storeOfflineData('habits', newHabit);
    return { data: newHabit, error: null };
  }
  
  const { data, error } = await supabase
    .from('habits')
    .insert(habitData)
    .select()
    .single();
    
  return { data, error };
};

export const updateHabit = async (id: string, updates: any) => {
  if (!isOnline()) {
    const updatedHabit = { ...updates, id };
    storeOfflineData('habits', updatedHabit);
    return { data: updatedHabit, error: null };
  }
  
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteHabit = async (id: string) => {
  if (!isOnline()) {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData.habits) {
      offlineData.habits = offlineData.habits.filter((habit: any) => habit.id !== id);
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    }
    return { error: null };
  }
  
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Journal functions
export const getJournalEntries = async () => {
  if (!isOnline()) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    return { data: offlineData.journal || [], error: null };
  }
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (!error && data) {
    // Cache the data for offline use
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    offlineData.journal = data;
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
    
  return { data, error };
};

export const addJournalEntry = async (entryData: any) => {
  if (!isOnline()) {
    const offlineId = `offline_${Date.now()}`;
    const newEntry = { ...entryData, id: offlineId };
    storeOfflineData('journal', newEntry);
    return { data: newEntry, error: null };
  }
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert(entryData)
    .select()
    .single();
    
  return { data, error };
};

export const getJournalEntry = async (id: string) => {
  if (!isOnline()) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData.journal) {
      const entry = offlineData.journal.find((entry: any) => entry.id === id);
      return { data: entry || null, error: null };
    }
    return { data: null, error: null };
  }
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single();
    
  return { data, error };
};

export const updateJournalEntry = async (id: string, updates: any) => {
  if (!isOnline()) {
    const updatedEntry = { ...updates, id };
    storeOfflineData('journal', updatedEntry);
    return { data: updatedEntry, error: null };
  }
  
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteJournalEntry = async (id: string) => {
  if (!isOnline()) {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData.journal) {
      offlineData.journal = offlineData.journal.filter((entry: any) => entry.id !== id);
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    }
    return { error: null };
  }
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Goals functions
export const getGoals = async () => {
  if (!isOnline()) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    return { data: offlineData.goals || [], error: null };
  }
  
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (!error && data) {
    // Cache the data for offline use
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    offlineData.goals = data;
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
    
  return { data, error };
};

export const addGoal = async (goalData: any) => {
  if (!isOnline()) {
    const offlineId = `offline_${Date.now()}`;
    const newGoal = { ...goalData, id: offlineId };
    storeOfflineData('goals', newGoal);
    return { data: newGoal, error: null };
  }
  
  const { data, error } = await supabase
    .from('goals')
    .insert(goalData)
    .select()
    .single();
    
  return { data, error };
};

export const updateGoal = async (id: string, updates: any) => {
  if (!isOnline()) {
    const updatedGoal = { ...updates, id };
    storeOfflineData('goals', updatedGoal);
    return { data: updatedGoal, error: null };
  }
  
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteGoal = async (id: string) => {
  if (!isOnline()) {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData.goals) {
      offlineData.goals = offlineData.goals.filter((goal: any) => goal.id !== id);
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    }
    return { error: null };
  }
  
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);
    
  return { error };
};

// Focus sessions
export const getFocusSessions = async () => {
  if (!isOnline()) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    return { data: offlineData.focus || [], error: null };
  }
  
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (!error && data) {
    // Cache the data for offline use
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    offlineData.focus = data;
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
    
  return { data, error };
};

export const addFocusSession = async (sessionData: any) => {
  if (!isOnline()) {
    const offlineId = `offline_${Date.now()}`;
    const newSession = { ...sessionData, id: offlineId };
    storeOfflineData('focus', newSession);
    return { data: newSession, error: null };
  }
  
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert(sessionData)
    .select()
    .single();
    
  return { data, error };
};

export const updateFocusSession = async (id: string, updates: any) => {
  if (!isOnline()) {
    const updatedSession = { ...updates, id };
    storeOfflineData('focus', updatedSession);
    return { data: updatedSession, error: null };
  }
  
  const { data, error } = await supabase
    .from('focus_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};

export const deleteFocusSession = async (id: string) => {
  if (!isOnline()) {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData.focus) {
      offlineData.focus = offlineData.focus.filter((session: any) => session.id !== id);
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    }
    return { error: null };
  }
  
  const { error } = await supabase
    .from('focus_sessions')
    .delete()
    .eq('id', id);
    
  return { error };
};

// AI functions
export const sendChatMessage = async (message: string, chatHistory: any[] = [], userId: string) => {
  if (!isOnline()) {
    return { 
      data: { 
        response: "⚠️ **Mode hors connexion**\n\nL'assistant IA n'est pas disponible en mode hors connexion. Veuillez vous connecter à Internet pour utiliser cette fonctionnalité."
      }, 
      error: null,
      status: 200
    };
  }
  
  const { data, error, status } = await supabase.functions.invoke('gemini-chat', {
    body: { message, chatHistory, userId }
  });
  
  return { data, error, status };
};

export const getAIAnalysis = async (userId: string) => {
  if (!isOnline()) {
    return { 
      data: { 
        analysis: "⚠️ **Mode hors connexion**\n\nL'analyse IA n'est pas disponible en mode hors connexion. Veuillez vous connecter à Internet pour utiliser cette fonctionnalité.",
        stats: null
      }, 
      error: null,
      status: 200
    };
  }
  
  const { data, error, status } = await supabase.functions.invoke('gemini-analysis', {
    body: { userId }
  });
  
  return { data, error, status };
};

// User settings
export const getUserSettings = async () => {
  if (!isOnline()) {
    const settings = localStorage.getItem('userSettings');
    return { data: settings ? JSON.parse(settings) : null, error: null };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: new Error('User not authenticated') };
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (!error && data) {
    // Cache settings for offline use
    localStorage.setItem('userSettings', JSON.stringify(data));
  }
    
  return { data, error };
};

export const updateUserSettings = async (updates: any) => {
  if (!isOnline()) {
    const currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    const newSettings = { ...currentSettings, ...updates };
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    return { data: newSettings, error: null };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: new Error('User not authenticated') };
  
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
    
  if (!error && data) {
    // Update cached settings
    localStorage.setItem('userSettings', JSON.stringify(data));
  }
    
  return { data, error };
};

// Contact form
export const sendContactEmail = async (name: string, email: string, message: string) => {
  if (!isOnline()) {
    // Store contact form data for later sending
    const contactRequests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
    contactRequests.push({ name, email, message, timestamp: new Date().toISOString() });
    localStorage.setItem('contactRequests', JSON.stringify(contactRequests));
    
    return { 
      data: { success: true, message: "Votre message sera envoyé quand la connexion sera rétablie." }, 
      error: null 
    };
  }
  
  const { data, error } = await supabase.functions.invoke('send-contact', {
    body: { name, email, message }
  });
  
  return { data, error };
};

// Subscription & Billing functions
export const getSubscriptionStatus = async () => {
  if (!isOnline()) {
    const subscriptionData = localStorage.getItem('subscriptionStatus');
    return { data: subscriptionData ? JSON.parse(subscriptionData) : { subscribed: false }, error: null };
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: { subscribed: false }, error: null };
    }
    
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      return { data: { subscribed: false }, error };
    }
    
    // Cache subscription status for offline use
    localStorage.setItem('subscriptionStatus', JSON.stringify(data));
    
    return { data, error: null };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { data: { subscribed: false }, error };
  }
};

// Admin functions
export const isUserAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if user has admin role
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
      
    return !!data && !error;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Network status handler
export const setupNetworkListeners = () => {
  window.addEventListener('online', async () => {
    console.log('Application is online. Syncing data...');
    await syncOfflineData();
    
    // Also try to send any cached contact form submissions
    const contactRequests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
    if (contactRequests.length > 0) {
      for (const request of contactRequests) {
        await sendContactEmail(request.name, request.email, request.message);
      }
      localStorage.removeItem('contactRequests');
    }
    
    // Publish an event that the app is back online
    window.dispatchEvent(new CustomEvent('app:online'));
  });
  
  window.addEventListener('offline', () => {
    console.log('Application is offline. Changes will be saved locally.');
    
    // Publish an event that the app is offline
    window.dispatchEvent(new CustomEvent('app:offline'));
  });
};
