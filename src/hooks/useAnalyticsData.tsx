
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfToday, parseISO } from "date-fns";

type AnalyticsDataType = {
  // Types de données pour les graphiques
  habitsData: { name: string; value: number }[];
  tasksData: { name: string; completed: number; pending: number }[];
  focusData: { date: string; minutes: number }[];
  activityData: { date: string; count: number }[];
  taskCompletionRate: number;
  totalFocusTime: number;
  streakCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useAnalyticsData = (): AnalyticsDataType => {
  const [habitsData, setHabitsData] = useState<{ name: string; value: number }[]>([]);
  const [tasksData, setTasksData] = useState<{ name: string; completed: number; pending: number }[]>([]);
  const [focusData, setFocusData] = useState<{ date: string; minutes: number }[]>([]);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);
  const [taskCompletionRate, setTaskCompletionRate] = useState<number>(0);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer les données des habitudes
      const { data: habitsRawData, error: habitsError } = await supabase
        .from('habits')
        .select('title, id, streak')
        .eq('user_id', user.id);
        
      if (habitsError) throw new Error("Erreur lors de la récupération des habitudes: " + habitsError.message);
      
      // Format the habit data using the correct column name (title instead of name)
      let maxStreak = 0;
      const formattedHabitsData = (habitsRawData || []).map(habit => {
        const streak = habit.streak || 0;
        if (streak > maxStreak) maxStreak = streak;
        return {
          name: habit.title, // Using 'title' instead of 'name'
          value: streak
        };
      });
      
      // Update global streak count
      setStreakCount(maxStreak);
      
      // Set habits data
      setHabitsData(formattedHabitsData.length > 0 ? formattedHabitsData : [
        { name: "Pas d'habitudes", value: 0 }
      ]);
      
      // Récupérer les données des tâches
      const { data: tasksRawData, error: tasksError } = await supabase
        .from('tasks')
        .select('priority, completed')
        .eq('user_id', user.id);
        
      if (tasksError) throw new Error("Erreur lors de la récupération des tâches: " + tasksError.message);
      
      // Calculate task completion rate
      const totalTasks = (tasksRawData || []).length;
      const completedTasks = (tasksRawData || []).filter(task => task.completed).length;
      setTaskCompletionRate(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
      
      // Regrouper par priorité
      const tasksByPriority = (tasksRawData || []).reduce((acc: Record<string, {completed: number, pending: number}>, task) => {
        const priority = task.priority || 'non-défini';
        if (!acc[priority]) {
          acc[priority] = { completed: 0, pending: 0 };
        }
        
        if (task.completed) {
          acc[priority].completed += 1;
        } else {
          acc[priority].pending += 1;
        }
        
        return acc;
      }, {});
      
      const formattedTasksData = Object.entries(tasksByPriority).map(([name, data]) => ({
        name: name === 'high' ? 'Élevée' : name === 'medium' ? 'Moyenne' : name === 'low' ? 'Faible' : 'Non-définie',
        completed: data.completed,
        pending: data.pending
      }));
      
      setTasksData(formattedTasksData.length > 0 ? formattedTasksData : [
        { name: "Pas de tâches", completed: 0, pending: 0 }
      ]);
      
      // Récupérer les données des sessions focus
      const { data: focusRawData, error: focusError } = await supabase
        .from('focus_sessions')
        .select('duration, created_at')
        .eq('user_id', user.id)
        .gt('created_at', subDays(new Date(), 14).toISOString())
        .order('created_at', { ascending: false });
        
      if (focusError) throw new Error("Erreur lors de la récupération des sessions focus: " + focusError.message);
      
      // Calculer le temps total de focus en minutes
      let totalMinutes = 0;
      
      // Formater les données de focus
      const focusByDay: Record<string, number> = {};
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = format(date, 'yyyy-MM-dd');
        focusByDay[formattedDate] = 0;
        return formattedDate;
      }).reverse();
      
      // Agréger les sessions par jour
      (focusRawData || []).forEach(session => {
        const sessionDate = format(parseISO(session.created_at), 'yyyy-MM-dd');
        const durationMinutes = Math.round(session.duration / 60);
        totalMinutes += durationMinutes;
        
        if (last7Days.includes(sessionDate)) {
          focusByDay[sessionDate] = (focusByDay[sessionDate] || 0) + durationMinutes;
        }
      });
      
      // Mettre à jour le temps total de focus
      setTotalFocusTime(totalMinutes);
      
      // Formater les données pour le graphique
      const formattedFocusData = Object.entries(focusByDay).map(([date, minutes]) => ({
        date: format(parseISO(date), 'dd MMM'),
        minutes
      }));
      
      setFocusData(formattedFocusData);
      
      // Récupérer les données d'activité générale
      const last7DaysDates = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      // Compter toutes les activités par jour en utilisant des requêtes directes
      const startDate = last7DaysDates[0];
      const endDate = last7DaysDates[last7DaysDates.length - 1] + 'T23:59:59';
      
      // Get habits activity
      const { data: habitsActivityData, error: habitsActivityError } = await supabase
        .from('habits')
        .select('updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', startDate)
        .lte('updated_at', endDate);
        
      // Get tasks activity
      const { data: tasksActivityData, error: tasksActivityError } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', startDate)
        .lte('updated_at', endDate);
        
      // Get focus sessions activity
      const { data: focusActivityData, error: focusActivityError } = await supabase
        .from('focus_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
        
      // Get journal entries activity
      const { data: journalActivityData, error: journalActivityError } = await supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
        
      if (habitsActivityError || tasksActivityError || focusActivityError || journalActivityError) {
        throw new Error("Erreur lors de la récupération des données d'activité: " 
          + (habitsActivityError || tasksActivityError || focusActivityError || journalActivityError).message);
      }
      
      // Combine all activity data
      const allActivityData = [
        ...(habitsActivityData || []).map(item => ({ date: new Date(item.updated_at).toISOString().split('T')[0] })),
        ...(tasksActivityData || []).map(item => ({ date: new Date(item.updated_at).toISOString().split('T')[0] })),
        ...(focusActivityData || []).map(item => ({ date: new Date(item.created_at).toISOString().split('T')[0] })),
        ...(journalActivityData || []).map(item => ({ date: new Date(item.created_at).toISOString().split('T')[0] }))
      ];
      
      // Mapper les activités par jour
      const activityByDay: Record<string, number> = {};
      last7DaysDates.forEach(day => {
        activityByDay[day] = 0;
      });
      
      allActivityData.forEach(item => {
        if (activityByDay[item.date] !== undefined) {
          activityByDay[item.date] += 1;
        }
      });
      
      const formattedActivityData = Object.entries(activityByDay).map(([date, count]) => ({
        date: format(parseISO(date), 'dd MMM'),
        count
      }));
      
      setActivityData(formattedActivityData);
      
    } catch (err: any) {
      console.error("Erreur lors de la récupération des données pour l'analyse:", err);
      setError(err.message || "Erreur lors du chargement des données d'analyse");
      
      // Définir des données par défaut en cas d'erreur
      if (habitsData.length === 0) {
        setHabitsData([{ name: "Pas de données", value: 0 }]);
      }
      if (tasksData.length === 0) {
        setTasksData([{ name: "Pas de données", completed: 0, pending: 0 }]);
      }
      if (focusData.length === 0) {
        setFocusData([{ date: "Aujourd'hui", minutes: 0 }]);
      }
      if (activityData.length === 0) {
        setActivityData([{ date: "Aujourd'hui", count: 0 }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return {
    habitsData,
    tasksData,
    focusData,
    activityData,
    taskCompletionRate,
    totalFocusTime,
    streakCount,
    isLoading,
    error,
    refetch: fetchData
  };
};
