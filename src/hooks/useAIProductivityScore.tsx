
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAIProductivityScore = () => {
  const [score, setScore] = useState<number>(0);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { user } = useAuth();

  const calculateScore = useCallback(async () => {
    if (!user) return;

    // Initialize variables outside try block so they're accessible in catch
    let habits: any[] = [];
    let tasks: any[] = [];
    let goals: any[] = [];

    try {
      setIsLoading(true);
      
      // Récupérer toutes les données utilisateur
      const [habitsRes, tasksRes, goalsRes, journalRes, focusRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calculer les métriques
      habits = habitsRes.data || [];
      tasks = tasksRes.data || [];
      goals = goalsRes.data || [];
      const journalEntries = journalRes.data || [];
      const focusSessions = focusRes.data || [];

      // Calculs des métriques
      const activeHabits = habits.filter(h => !h.is_archived);
      const completedTasks = tasks.filter(t => t.completed);
      const totalProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
      const avgGoalProgress = goals.length > 0 ? totalProgress / goals.length : 0;
      const totalFocusTime = focusSessions.reduce((sum, f) => sum + (f.duration || 0), 0);

      // Demander à l'IA d'analyser
      const response = await supabase.functions.invoke('gemini-analysis', {
        body: {
          user_id: user.id,
          data: {
            habits: {
              total: habits.length,
              active: activeHabits.length,
              avgStreak: activeHabits.reduce((sum, h) => sum + (h.streak || 0), 0) / Math.max(activeHabits.length, 1)
            },
            tasks: {
              total: tasks.length,
              completed: completedTasks.length,
              completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
            },
            goals: {
              total: goals.length,
              avgProgress: avgGoalProgress,
              completed: goals.filter(g => g.completed).length
            },
            journal: {
              entriesThisWeek: journalEntries.length
            },
            focus: {
              totalMinutes: Math.round(totalFocusTime / 60),
              sessions: focusSessions.length
            }
          }
        }
      });

      if (response.data) {
        setScore(response.data.score || 0);
        setInsights(response.data.insights || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erreur lors du calcul du score IA:', error);
      // Score de fallback basé sur les données disponibles
      const fallbackScore = Math.min(100, Math.round(
        (habits.filter(h => !h.is_archived && h.streak && h.streak > 0).length * 20) +
        (tasks.filter(t => t.completed).length * 10) +
        (goals.reduce((sum, g) => sum + (g.progress || 0), 0) / Math.max(goals.length, 1))
      ));
      setScore(fallbackScore);
      setInsights(['Analyse en cours...']);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateScore();
    
    // Mettre à jour toutes les 10 minutes
    const interval = setInterval(calculateScore, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [calculateScore]);

  return {
    score,
    insights,
    isLoading,
    lastUpdate,
    refresh: calculateScore
  };
};
