
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface RealisticProductivityData {
  score: number;
  level: string;
  badges: string[];
  components: {
    taskEfficiency: number;
    habitConsistency: number;
    focusQuality: number;
    goalProgress: number;
    wellBeing: number;
  };
  insights: string[];
  recommendations: string[];
  weeklyTrend: number;
}

export const useRealisticProductivityScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['realistic-productivity-score', user?.id],
    queryFn: async (): Promise<RealisticProductivityData> => {
      if (!user) {
        return {
          score: 0,
          level: "Débutant",
          badges: [],
          components: {
            taskEfficiency: 0,
            habitConsistency: 0,
            focusQuality: 0,
            goalProgress: 0,
            wellBeing: 0
          },
          insights: [],
          recommendations: [],
          weeklyTrend: 0
        };
      }

      try {
        // Récupération des données réelles pour un calcul précis
        const [
          tasksResult,
          habitsResult,
          goalsResult,
          focusResult,
          journalResult,
          completionsResult
        ] = await Promise.allSettled([
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('focus_sessions').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('habit_completions').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const tasks = tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [];
        const habits = habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [];
        const goals = goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [];
        const focusSessions = focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [];
        const journalEntries = journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [];
        const habitCompletions = completionsResult.status === 'fulfilled' ? (completionsResult.value.data || []) : [];

        // Calcul réaliste des composants
        const taskEfficiency = calculateTaskEfficiency(tasks);
        const habitConsistency = calculateHabitConsistency(habits, habitCompletions);
        const focusQuality = calculateFocusQuality(focusSessions);
        const goalProgress = calculateGoalProgress(goals);
        const wellBeing = calculateWellBeing(journalEntries);

        // Score pondéré plus réaliste
        const weightedScore = Math.round(
          taskEfficiency * 0.25 +
          habitConsistency * 0.25 +
          focusQuality * 0.20 +
          goalProgress * 0.20 +
          wellBeing * 0.10
        );

        const level = determineRealisticLevel(weightedScore, tasks.length, habits.length);
        const badges = generateRealisticBadges(taskEfficiency, habitConsistency, focusQuality, goalProgress, wellBeing);
        
        return {
          score: weightedScore,
          level,
          badges,
          components: {
            taskEfficiency,
            habitConsistency,
            focusQuality,
            goalProgress,
            wellBeing
          },
          insights: generateInsights(taskEfficiency, habitConsistency, focusQuality, goalProgress, wellBeing),
          recommendations: generateRecommendations(taskEfficiency, habitConsistency, focusQuality, goalProgress, wellBeing),
          weeklyTrend: calculateWeeklyTrend(tasks, habitCompletions, focusSessions)
        };

      } catch (error) {
        console.error('Error calculating realistic productivity score:', error);
        return {
          score: 0,
          level: "Débutant",
          badges: [],
          components: {
            taskEfficiency: 0,
            habitConsistency: 0,
            focusQuality: 0,
            goalProgress: 0,
            wellBeing: 0
          },
          insights: ["Commencez par créer vos premières tâches et habitudes"],
          recommendations: ["Utilisez DeepFlow pour structurer votre productivité"],
          weeklyTrend: 0
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

function calculateTaskEfficiency(tasks: any[]): number {
  if (tasks.length === 0) return 20; // Score de base pour nouveaux utilisateurs
  
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed);
  const priorityTasksCompleted = completedTasks.filter(t => t.priority === 'high').length;
  
  const completionRate = (completedTasks.length / tasks.length) * 100;
  const overdueRatio = tasks.length > 0 ? (overdueTasks.length / tasks.length) * 100 : 0;
  const priorityBonus = priorityTasksCompleted * 5;
  
  return Math.min(100, Math.max(0, completionRate - overdueRatio + priorityBonus));
}

function calculateHabitConsistency(habits: any[], completions: any[]): number {
  if (habits.length === 0) return 15; // Score de base
  
  const activeHabits = habits.filter(h => !h.is_archived);
  if (activeHabits.length === 0) return 10;
  
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCompletions = completions.filter(c => new Date(c.created_at) >= last7Days);
  
  const consistencyScores = activeHabits.map(habit => {
    const habitCompletions = recentCompletions.filter(c => c.habit_id === habit.id);
    const expectedCompletions = habit.frequency === 'daily' ? 7 : habit.frequency === 'weekly' ? 1 : 2;
    return Math.min(100, (habitCompletions.length / expectedCompletions) * 100);
  });
  
  const avgConsistency = consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length;
  const streakBonus = habits.reduce((acc, habit) => acc + Math.min(habit.streak * 2, 20), 0) / habits.length;
  
  return Math.min(100, avgConsistency + streakBonus);
}

function calculateFocusQuality(sessions: any[]): number {
  if (sessions.length === 0) return 5;
  
  const totalMinutes = sessions.reduce((acc, session) => acc + (session.duration || 0), 0);
  const avgSessionLength = totalMinutes / sessions.length;
  const sessionsPerWeek = sessions.length / 4; // Environ 4 semaines
  
  const qualityScore = Math.min(100, (avgSessionLength / 45) * 50 + (sessionsPerWeek / 3) * 50);
  return Math.max(0, qualityScore);
}

function calculateGoalProgress(goals: any[]): number {
  if (goals.length === 0) return 10;
  
  const activeGoals = goals.filter(g => !g.is_archived);
  if (activeGoals.length === 0) return 5;
  
  const avgProgress = activeGoals.reduce((acc, goal) => acc + (goal.progress || 0), 0) / activeGoals.length;
  const completedGoals = activeGoals.filter(g => g.completed).length;
  const completionBonus = (completedGoals / activeGoals.length) * 20;
  
  return Math.min(100, avgProgress + completionBonus);
}

function calculateWellBeing(journalEntries: any[]): number {
  if (journalEntries.length === 0) return 30;
  
  const moodScores = journalEntries
    .filter(entry => entry.mood)
    .map(entry => {
      const moodValue = { 'excellent': 100, 'good': 80, 'neutral': 60, 'tired': 40, 'stressed': 20 };
      return moodValue[entry.mood as keyof typeof moodValue] || 60;
    });
  
  if (moodScores.length === 0) return 40;
  
  const avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
  const regularity = Math.min(100, (journalEntries.length / 30) * 100); // 1 par jour idéalement
  
  return (avgMood * 0.7) + (regularity * 0.3);
}

function determineRealisticLevel(score: number, taskCount: number, habitCount: number): string {
  // Prise en compte de l'expérience utilisateur
  const experienceBonus = Math.min(10, (taskCount + habitCount) / 10);
  const adjustedScore = score + experienceBonus;
  
  if (adjustedScore >= 85) return 'Maître';
  if (adjustedScore >= 70) return 'Expert';
  if (adjustedScore >= 55) return 'Avancé';
  if (adjustedScore >= 35) return 'Intermédiaire';
  return 'Débutant';
}

function generateRealisticBadges(task: number, habit: number, focus: number, goal: number, wellBeing: number): string[] {
  const badges: string[] = [];
  
  if (task >= 80) badges.push('🎯 Maître des Tâches');
  if (habit >= 75) badges.push('🔄 Habitudes Solides');
  if (focus >= 70) badges.push('🧠 Concentration Pro');
  if (goal >= 70) badges.push('🏆 Objectifs Alignés');
  if (wellBeing >= 75) badges.push('😌 Équilibre Mental');
  
  if (task >= 60 && habit >= 60) badges.push('⚡ Productivité Équilibrée');
  if (focus >= 50 && wellBeing >= 60) badges.push('🧘 Focus Zen');
  
  return badges.slice(0, 4); // Limite à 4 badges
}

function generateInsights(task: number, habit: number, focus: number, goal: number, wellBeing: number): string[] {
  const insights: string[] = [];
  
  const scores = { task, habit, focus, goal, wellBeing };
  const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
  
  insights.push(`Votre point fort : ${getComponentName(sortedScores[0][0])} (${sortedScores[0][1]}%)`);
  insights.push(`Zone d'amélioration : ${getComponentName(sortedScores[4][0])} (${sortedScores[4][1]}%)`);
  
  if (Math.max(...Object.values(scores)) - Math.min(...Object.values(scores)) > 40) {
    insights.push("Votre productivité est déséquilibrée. Concentrez-vous sur vos points faibles.");
  }
  
  return insights;
}

function generateRecommendations(task: number, habit: number, focus: number, goal: number, wellBeing: number): string[] {
  const recommendations: string[] = [];
  
  if (task < 50) recommendations.push("Utilisez la méthode GTD pour mieux organiser vos tâches");
  if (habit < 50) recommendations.push("Commencez par 1-2 habitudes simples et soyez constant");
  if (focus < 40) recommendations.push("Essayez la technique Pomodoro (25min focus + 5min pause)");
  if (goal < 40) recommendations.push("Définissez des objectifs SMART plus précis");
  if (wellBeing < 50) recommendations.push("Tenez un journal quotidien pour mieux comprendre vos émotions");
  
  return recommendations.slice(0, 3);
}

function calculateWeeklyTrend(tasks: any[], completions: any[], sessions: any[]): number {
  // Calcul simplifié de la tendance hebdomadaire
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekActivity = tasks.filter(t => new Date(t.updated_at) >= thisWeek).length +
                          completions.filter(c => new Date(c.created_at) >= thisWeek).length +
                          sessions.filter(s => new Date(s.created_at) >= thisWeek).length;
  
  const lastWeekActivity = tasks.filter(t => new Date(t.updated_at) >= lastWeek && new Date(t.updated_at) < thisWeek).length +
                          completions.filter(c => new Date(c.created_at) >= lastWeek && new Date(c.created_at) < thisWeek).length +
                          sessions.filter(s => new Date(s.created_at) >= lastWeek && new Date(s.created_at) < thisWeek).length;
  
  if (lastWeekActivity === 0) return thisWeekActivity > 0 ? 50 : 0;
  
  return Math.min(100, Math.max(-100, ((thisWeekActivity - lastWeekActivity) / lastWeekActivity) * 100));
}

function getComponentName(key: string): string {
  const names: Record<string, string> = {
    task: "Efficacité des tâches",
    habit: "Consistance des habitudes", 
    focus: "Qualité du focus",
    goal: "Progrès des objectifs",
    wellBeing: "Bien-être mental"
  };
  return names[key] || key;
}
