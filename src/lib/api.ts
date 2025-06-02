import { supabase } from "@/integrations/supabase/client";
import { generateUniqueId } from "@/lib/utils";

// Contrôle de connexion et mise en cache
let isOnline = true;
const checkNetwork = () => {
  isOnline = navigator.onLine;
  return isOnline;
};

// Écoute des changements de statut réseau
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { 
    isOnline = true;
    syncOfflineData().catch(console.error);
  });
  window.addEventListener('offline', () => { isOnline = false; });
}

// Tables pour mise en cache hors ligne
const OFFLINE_TABLES = ['tasks', 'habits', 'goals', 'journal_entries', 'focus_sessions'];

// Fonctions de stockage hors ligne
const getOfflineStore = (storeName: string) => {
  const store = localStorage.getItem(`offline_${storeName}`);
  return store ? JSON.parse(store) : [];
};

const saveOfflineStore = (storeName: string, data: any[]) => {
  localStorage.setItem(`offline_${storeName}`, JSON.stringify(data));
};

const addToOfflineStore = (storeName: string, item: any) => {
  const store = getOfflineStore(storeName);
  // S'assurer que l'élément a un offline_id pour le suivi
  if (!item.offline_id) {
    item.offline_id = generateUniqueId();
  }
  
  // Ajouter un timestamp pour le suivi des modifications
  item.updated_at = new Date().toISOString();
  
  // Rechercher et mettre à jour si existe, sinon ajouter
  const existingIndex = store.findIndex((i: any) => 
    (i.id && i.id === item.id) || (i.offline_id && i.offline_id === item.offline_id)
  );
  
  if (existingIndex >= 0) {
    store[existingIndex] = { ...store[existingIndex], ...item };
  } else {
    store.push(item);
  }
  
  saveOfflineStore(storeName, store);
  return item;
};

// Synchronisation des données hors ligne
export const syncOfflineData = async () => {
  if (!checkNetwork()) return { success: false, error: "Hors ligne" };
  
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return { success: false, error: "Non authentifié" };
    
    const dataToSync: Record<string, any[]> = {};
    
    // Collecter toutes les données hors ligne
    OFFLINE_TABLES.forEach(table => {
      const offlineData = getOfflineStore(table);
      if (offlineData && offlineData.length > 0) {
        dataToSync[table] = offlineData;
      }
    });
    
    // S'il n'y a pas de données à synchroniser, terminer
    if (Object.keys(dataToSync).length === 0) {
      return { success: true, message: "Pas de données à synchroniser" };
    }
    
    // Appeler l'edge function pour synchroniser les données
    const { data, error } = await supabase.functions.invoke('sync-offline-data', {
      body: dataToSync
    });
    
    if (error) {
      console.error("Erreur synchronisation:", error);
      return { success: false, error: error.message };
    }
    
    // Vider les magasins locaux après synchronisation réussie
    if (data && data.success) {
      OFFLINE_TABLES.forEach(table => {
        saveOfflineStore(table, []);
      });
      return { success: true, message: "Synchronisation réussie" };
    }
    
    return { success: false, error: "Échec de synchronisation" };
  } catch (error) {
    console.error("Erreur dans syncOfflineData:", error);
    return { success: false, error: String(error) };
  }
};

// === TÂCHES ===
export const getTasks = async () => {
  try {
    // Essayer de récupérer depuis Supabase si en ligne
    if (checkNetwork()) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mettre en cache pour utilisation hors ligne
      saveOfflineStore('tasks', data || []);
      return { data, error: null };
    } else {
      // Utiliser les données hors ligne
      const offlineTasks = getOfflineStore('tasks');
      return { data: offlineTasks, error: null, offline: true };
    }
  } catch (error) {
    console.error("Erreur getTasks:", error);
    // Si erreur, essayer les données hors ligne
    const offlineTasks = getOfflineStore('tasks');
    return { data: offlineTasks, error: String(error), offline: true };
  }
};

export const createTask = async (task: any) => {
  // Ajouter un ID temporaire pour le suivi
  const taskWithOfflineId = { ...task, offline_id: generateUniqueId() };
  
  // Toujours stocker en local d'abord pour une expérience réactive
  const offlineTask = addToOfflineStore('tasks', taskWithOfflineId);
  
  // Si hors ligne, retourner immédiatement
  if (!checkNetwork()) {
    return { data: offlineTask, error: null, offline: true };
  }
  
  try {
    // Tenter d'enregistrer dans Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select();
    
    if (error) throw error;
    
    // Mettre à jour le stockage local avec l'ID réel
    if (data && data.length > 0) {
      const updatedTasks = getOfflineStore('tasks').map((t: any) => 
        t.offline_id === offlineTask.offline_id ? { ...t, id: data[0].id } : t
      );
      saveOfflineStore('tasks', updatedTasks);
    }
    
    return { data: data && data.length > 0 ? data[0] : offlineTask, error: null };
  } catch (error) {
    console.error("Erreur createTask:", error);
    // Garder le local en cas d'échec
    return { data: offlineTask, error: String(error), offline: true };
  }
};

export const updateTask = async (id: string, updates: any) => {
  // Mettre à jour en local d'abord
  const offlineTasks = getOfflineStore('tasks');
  const taskIndex = offlineTasks.findIndex((t: any) => t.id === id || t.offline_id === id);
  
  if (taskIndex >= 0) {
    const updatedTask = { ...offlineTasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
    offlineTasks[taskIndex] = updatedTask;
    saveOfflineStore('tasks', offlineTasks);
    
    // Si hors ligne, retourner immédiatement
    if (!checkNetwork()) {
      return { data: updatedTask, error: null, offline: true };
    }
    
    // Si la tâche n'a pas d'ID réel, elle n'existe pas encore dans la base de données
    if (!updatedTask.id || updatedTask.id.startsWith('offline_')) {
      return { data: updatedTask, error: null, offline: true };
    }
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return { data: data && data.length > 0 ? data[0] : updatedTask, error: null };
    } catch (error) {
      console.error("Erreur updateTask:", error);
      return { data: updatedTask, error: String(error), offline: true };
    }
  } else {
    return { data: null, error: "Tâche non trouvée", offline: true };
  }
};

export const deleteTask = async (id: string) => {
  // Supprimer en local d'abord
  const offlineTasks = getOfflineStore('tasks');
  const updatedTasks = offlineTasks.filter((t: any) => t.id !== id && t.offline_id !== id);
  saveOfflineStore('tasks', updatedTasks);
  
  // Si hors ligne, retourner immédiatement
  if (!checkNetwork()) {
    return { error: null, offline: true };
  }
  
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Erreur deleteTask:", error);
    return { error: String(error), offline: true };
  }
};

// === HABITUDES ===
// ...Même logique que pour les tâches avec des adaptations appropriées
export const getHabits = async () => {
  try {
    if (checkNetwork()) {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      saveOfflineStore('habits', data || []);
      return { data, error: null };
    } else {
      const offlineHabits = getOfflineStore('habits');
      return { data: offlineHabits, error: null, offline: true };
    }
  } catch (error) {
    console.error("Erreur getHabits:", error);
    const offlineHabits = getOfflineStore('habits');
    return { data: offlineHabits, error: String(error), offline: true };
  }
};

export const createHabit = async (habit: any) => {
  const habitWithOfflineId = { ...habit, offline_id: generateUniqueId() };
  const offlineHabit = addToOfflineStore('habits', habitWithOfflineId);
  
  if (!checkNetwork()) {
    return { data: offlineHabit, error: null, offline: true };
  }
  
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert([habit])
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const updatedHabits = getOfflineStore('habits').map((h: any) => 
        h.offline_id === offlineHabit.offline_id ? { ...h, id: data[0].id } : h
      );
      saveOfflineStore('habits', updatedHabits);
    }
    
    return { data: data && data.length > 0 ? data[0] : offlineHabit, error: null };
  } catch (error) {
    console.error("Erreur createHabit:", error);
    return { data: offlineHabit, error: String(error), offline: true };
  }
};

export const updateHabit = async (id: string, updates: any) => {
  const offlineHabits = getOfflineStore('habits');
  const habitIndex = offlineHabits.findIndex((h: any) => h.id === id || h.offline_id === id);
  
  if (habitIndex >= 0) {
    const updatedHabit = { ...offlineHabits[habitIndex], ...updates, updated_at: new Date().toISOString() };
    offlineHabits[habitIndex] = updatedHabit;
    saveOfflineStore('habits', offlineHabits);
    
    if (!checkNetwork()) {
      return { data: updatedHabit, error: null, offline: true };
    }
    
    if (!updatedHabit.id || updatedHabit.id.startsWith('offline_')) {
      return { data: updatedHabit, error: null, offline: true };
    }
    
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return { data: data && data.length > 0 ? data[0] : updatedHabit, error: null };
    } catch (error) {
      console.error("Erreur updateHabit:", error);
      return { data: updatedHabit, error: String(error), offline: true };
    }
  } else {
    return { data: null, error: "Habitude non trouvée", offline: true };
  }
};

export const deleteHabit = async (id: string) => {
  const offlineHabits = getOfflineStore('habits');
  const updatedHabits = offlineHabits.filter((h: any) => h.id !== id && h.offline_id !== id);
  saveOfflineStore('habits', updatedHabits);
  
  if (!checkNetwork()) {
    return { error: null, offline: true };
  }
  
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Erreur deleteHabit:", error);
    return { error: String(error), offline: true };
  }
};

// === OBJECTIFS ===
// ... Logique similaire aux tâches et habitudes
export const getGoals = async () => {
  try {
    if (checkNetwork()) {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      saveOfflineStore('goals', data || []);
      return { data, error: null };
    } else {
      const offlineGoals = getOfflineStore('goals');
      return { data: offlineGoals, error: null, offline: true };
    }
  } catch (error) {
    console.error("Erreur getGoals:", error);
    const offlineGoals = getOfflineStore('goals');
    return { data: offlineGoals, error: String(error), offline: true };
  }
};

export const createGoal = async (goal: any) => {
  const goalWithOfflineId = { ...goal, offline_id: generateUniqueId() };
  const offlineGoal = addToOfflineStore('goals', goalWithOfflineId);
  
  if (!checkNetwork()) {
    return { data: offlineGoal, error: null, offline: true };
  }
  
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const updatedGoals = getOfflineStore('goals').map((g: any) => 
        g.offline_id === offlineGoal.offline_id ? { ...g, id: data[0].id } : g
      );
      saveOfflineStore('goals', updatedGoals);
    }
    
    return { data: data && data.length > 0 ? data[0] : offlineGoal, error: null };
  } catch (error) {
    console.error("Erreur createGoal:", error);
    return { data: offlineGoal, error: String(error), offline: true };
  }
};

export const updateGoal = async (id: string, updates: any) => {
  const offlineGoals = getOfflineStore('goals');
  const goalIndex = offlineGoals.findIndex((g: any) => g.id === id || g.offline_id === id);
  
  if (goalIndex >= 0) {
    const updatedGoal = { ...offlineGoals[goalIndex], ...updates, updated_at: new Date().toISOString() };
    offlineGoals[goalIndex] = updatedGoal;
    saveOfflineStore('goals', offlineGoals);
    
    if (!checkNetwork()) {
      return { data: updatedGoal, error: null, offline: true };
    }
    
    if (!updatedGoal.id || updatedGoal.id.startsWith('offline_')) {
      return { data: updatedGoal, error: null, offline: true };
    }
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return { data: data && data.length > 0 ? data[0] : updatedGoal, error: null };
    } catch (error) {
      console.error("Erreur updateGoal:", error);
      return { data: updatedGoal, error: String(error), offline: true };
    }
  } else {
    return { data: null, error: "Objectif non trouvé", offline: true };
  }
};

export const deleteGoal = async (id: string) => {
  const offlineGoals = getOfflineStore('goals');
  const updatedGoals = offlineGoals.filter((g: any) => g.id !== id && g.offline_id !== id);
  saveOfflineStore('goals', updatedGoals);
  
  if (!checkNetwork()) {
    return { error: null, offline: true };
  }
  
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Erreur deleteGoal:", error);
    return { error: String(error), offline: true };
  }
};

// === JOURNAL ===
// ... Logique similaire aux autres fonctionnalités
export const getJournalEntries = async () => {
  try {
    if (checkNetwork()) {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      saveOfflineStore('journal_entries', data || []);
      return { data, error: null };
    } else {
      const offlineEntries = getOfflineStore('journal_entries');
      return { data: offlineEntries, error: null, offline: true };
    }
  } catch (error) {
    console.error("Erreur getJournalEntries:", error);
    const offlineEntries = getOfflineStore('journal_entries');
    return { data: offlineEntries, error: String(error), offline: true };
  }
};

export const createJournalEntry = async (entry: any) => {
  const entryWithOfflineId = { ...entry, offline_id: generateUniqueId() };
  const offlineEntry = addToOfflineStore('journal_entries', entryWithOfflineId);
  
  if (!checkNetwork()) {
    return { data: offlineEntry, error: null, offline: true };
  }
  
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entry])
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const updatedEntries = getOfflineStore('journal_entries').map((e: any) => 
        e.offline_id === offlineEntry.offline_id ? { ...e, id: data[0].id } : e
      );
      saveOfflineStore('journal_entries', updatedEntries);
    }
    
    return { data: data && data.length > 0 ? data[0] : offlineEntry, error: null };
  } catch (error) {
    console.error("Erreur createJournalEntry:", error);
    return { data: offlineEntry, error: String(error), offline: true };
  }
};

export const updateJournalEntry = async (id: string, updates: any) => {
  const offlineEntries = getOfflineStore('journal_entries');
  const entryIndex = offlineEntries.findIndex((e: any) => e.id === id || e.offline_id === id);
  
  if (entryIndex >= 0) {
    const updatedEntry = { ...offlineEntries[entryIndex], ...updates, updated_at: new Date().toISOString() };
    offlineEntries[entryIndex] = updatedEntry;
    saveOfflineStore('journal_entries', offlineEntries);
    
    if (!checkNetwork()) {
      return { data: updatedEntry, error: null, offline: true };
    }
    
    if (!updatedEntry.id || updatedEntry.id.startsWith('offline_')) {
      return { data: updatedEntry, error: null, offline: true };
    }
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return { data: data && data.length > 0 ? data[0] : updatedEntry, error: null };
    } catch (error) {
      console.error("Erreur updateJournalEntry:", error);
      return { data: updatedEntry, error: String(error), offline: true };
    }
  } else {
    return { data: null, error: "Entrée de journal non trouvée", offline: true };
  }
};

export const deleteJournalEntry = async (id: string) => {
  const offlineEntries = getOfflineStore('journal_entries');
  const updatedEntries = offlineEntries.filter((e: any) => e.id !== id && e.offline_id !== id);
  saveOfflineStore('journal_entries', updatedEntries);
  
  if (!checkNetwork()) {
    return { error: null, offline: true };
  }
  
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Erreur deleteJournalEntry:", error);
    return { error: String(error), offline: true };
  }
};

// === SESSIONS FOCUS ===
// ... Logique similaire aux autres fonctionnalités
export const getFocusSessions = async () => {
  try {
    if (checkNetwork()) {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      saveOfflineStore('focus_sessions', data || []);
      return { data, error: null };
    } else {
      const offlineSessions = getOfflineStore('focus_sessions');
      return { data: offlineSessions, error: null, offline: true };
    }
  } catch (error) {
    console.error("Erreur getFocusSessions:", error);
    const offlineSessions = getOfflineStore('focus_sessions');
    return { data: offlineSessions, error: String(error), offline: true };
  }
};

export const createFocusSession = async (session: any) => {
  const sessionWithOfflineId = { ...session, offline_id: generateUniqueId() };
  const offlineSession = addToOfflineStore('focus_sessions', sessionWithOfflineId);
  
  if (!checkNetwork()) {
    return { data: offlineSession, error: null, offline: true };
  }
  
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([session])
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const updatedSessions = getOfflineStore('focus_sessions').map((s: any) => 
        s.offline_id === offlineSession.offline_id ? { ...s, id: data[0].id } : s
      );
      saveOfflineStore('focus_sessions', updatedSessions);
    }
    
    return { data: data && data.length > 0 ? data[0] : offlineSession, error: null };
  } catch (error) {
    console.error("Erreur createFocusSession:", error);
    return { data: offlineSession, error: String(error), offline: true };
  }
};

export const updateFocusSession = async (id: string, updates: any) => {
  const offlineSessions = getOfflineStore('focus_sessions');
  const sessionIndex = offlineSessions.findIndex((s: any) => s.id === id || s.offline_id === id);
  
  if (sessionIndex >= 0) {
    const updatedSession = { ...offlineSessions[sessionIndex], ...updates, updated_at: new Date().toISOString() };
    offlineSessions[sessionIndex] = updatedSession;
    saveOfflineStore('focus_sessions', offlineSessions);
    
    if (!checkNetwork()) {
      return { data: updatedSession, error: null, offline: true };
    }
    
    if (!updatedSession.id || updatedSession.id.startsWith('offline_')) {
      return { data: updatedSession, error: null, offline: true };
    }
    
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return { data: data && data.length > 0 ? data[0] : updatedSession, error: null };
    } catch (error) {
      console.error("Erreur updateFocusSession:", error);
      return { data: updatedSession, error: String(error), offline: true };
    }
  } else {
    return { data: null, error: "Session focus non trouvée", offline: true };
  }
};

export const deleteFocusSession = async (id: string) => {
  const offlineSessions = getOfflineStore('focus_sessions');
  const updatedSessions = offlineSessions.filter((s: any) => s.id !== id && s.offline_id !== id);
  saveOfflineStore('focus_sessions', updatedSessions);
  
  if (!checkNetwork()) {
    return { error: null, offline: true };
  }
  
  try {
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Erreur deleteFocusSession:", error);
    return { error: String(error), offline: true };
  }
};

// === PARAMÈTRES UTILISATEUR ===
export const getUserSettings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: "Utilisateur non authentifié" };
    }
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error("Erreur getUserSettings:", error);
    return { data: null, error: String(error) };
  }
};

export const updateUserSettings = async (settings: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: "Utilisateur non authentifié" };
    }
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('id', user.id)
      .select();
    
    if (error) throw error;
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  } catch (error) {
    console.error("Erreur updateUserSettings:", error);
    return { data: null, error: String(error) };
  }
};

// === ABONNEMENTS ===
export const getUserSubscription = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: "Utilisateur non authentifié" };
    }
    
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error("Erreur getUserSubscription:", error);
    return { data: null, error: String(error) };
  }
};

// === RÔLES UTILISATEUR ===
export const getUserRoles = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: [], error: "Utilisateur non authentifié" };
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Erreur getUserRoles:", error);
    return { data: [], error: String(error) };
  }
};

export const isUserAdmin = async () => {
  try {
    const { data, error } = await getUserRoles();
    
    if (error) throw error;
    
    return data.some(role => role.role === 'admin');
  } catch (error) {
    console.error("Erreur isUserAdmin:", error);
    return false;
  }
};

// === IA ASSISTANT ===
export const sendChatMessage = async (message: string, chatHistory: any[] = [], userId?: string) => {
  try {
    if (!checkNetwork()) {
      return { 
        data: { 
          response: "⚠️ **Mode hors ligne**\n\nL'assistant IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité." 
        }, 
        error: null, 
        offline: true 
      };
    }
    
    // Use the enhanced chat function that has access to user data
    const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
      body: { message, chatHistory, userId }
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error("Erreur sendChatMessage:", error);
    return { 
      data: { 
        response: "❌ **Désolé, une erreur s'est produite.**\n\nJe n'ai pas pu traiter votre demande. Veuillez réessayer plus tard." 
      }, 
      error: String(error) 
    };
  }
};

// === IA ANALYSE ===
export const getAIAnalysis = async (userId?: string) => {
  try {
    if (!checkNetwork()) {
      return { 
        data: { 
          analysis: "⚠️ **Mode hors ligne**\n\nL'analyse IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité." 
        }, 
        error: null, 
        offline: true 
      };
    }
    
    const { data, error } = await supabase.functions.invoke('gemini-analysis', {
      body: { userId }
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error("Erreur getAIAnalysis:", error);
    return { 
      data: { 
        analysis: "❌ **Une erreur est survenue**\n\nImpossible de générer l'analyse pour le moment. Veuillez réessayer plus tard." 
      }, 
      error: String(error) 
    };
  }
};
