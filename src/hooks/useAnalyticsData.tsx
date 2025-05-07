
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AnalyticsDataType = {
  // Types de données pour les graphiques
  habitsData: { name: string; value: number }[];
  tasksData: { name: string; completed: number; pending: number }[];
  focusData: { date: string; minutes: number }[];
  activityData: { date: string; count: number }[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export const useAnalyticsData = (): AnalyticsDataType => {
  const [habitsData, setHabitsData] = useState<{ name: string; value: number }[]>([]);
  const [tasksData, setTasksData] = useState<{ name: string; completed: number; pending: number }[]>([]);
  const [focusData, setFocusData] = useState<{ date: string; minutes: number }[]>([]);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer les données des habitudes
      const { data: habitsRawData, error: habitsError } = await supabase
        .from('habits')
        .select('name, completions:habit_completions(id)')
        .eq('user_id', user.id);
        
      if (habitsError) throw habitsError;
      
      const formattedHabitsData = (habitsRawData || []).map(habit => ({
        name: habit.name,
        value: Array.isArray(habit.completions) ? habit.completions.length : 0
      }));
      
      setHabitsData(formattedHabitsData.length > 0 ? formattedHabitsData : [
        { name: "Pas d'habitudes", value: 0 }
      ]);
      
      // Récupérer les données des tâches
      const { data: tasksRawData, error: tasksError } = await supabase
        .from('tasks')
        .select('priority, completed')
        .eq('user_id', user.id);
        
      if (tasksError) throw tasksError;
      
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
        .order('created_at', { ascending: false })
        .limit(7);
        
      if (focusError) throw focusError;
      
      // Formater les données de focus
      const formattedFocusData = (focusRawData || []).map(session => ({
        date: new Date(session.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        minutes: Math.round(session.duration / 60) // Convertir en minutes
      })).reverse();
      
      setFocusData(formattedFocusData.length > 0 ? formattedFocusData : [
        { date: "Aujourd'hui", minutes: 0 },
        { date: "Hier", minutes: 0 },
      ]);
      
      // Récupérer les données d'activité générale
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      // Compter toutes les activités par jour
      const { data: activityRawData, error: activityError } = await supabase
        .rpc('get_user_activity_count', { user_id_param: user.id });
        
      if (activityError) throw activityError;
      
      // Mapper les activités par jour
      const activityByDay: Record<string, number> = {};
      last7Days.forEach(day => {
        activityByDay[day] = 0;
      });
      
      if (Array.isArray(activityRawData)) {
        activityRawData.forEach(item => {
          const day = new Date(item.date).toISOString().split('T')[0];
          if (activityByDay[day] !== undefined) {
            activityByDay[day] = item.count;
          }
        });
      }
      
      const formattedActivityData = Object.entries(activityByDay).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
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
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return {
    habitsData,
    tasksData,
    focusData,
    activityData,
    isLoading,
    error,
    refetch: fetchData
  };
};
