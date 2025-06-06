
import { useMemo } from 'react';
import { useAnalyticsData } from './useAnalyticsData';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ProductivityMetrics {
  score: number;
  level: string;
  badges: string[];
  streakBonus: number;
  completionRate: number;
  focusTimeScore: number;
  consistencyScore: number;
  qualityScore: number;
  timeManagementScore: number;
  journalScore: number;
  goalScore: number;
}

// Fonction pour calculer et sauvegarder le score via l'IA
const updateProductivityScoreWithAI = async (userId: string, metricsData: any) => {
  try {
    await supabase.functions.invoke('gemini-analysis', {
      body: {
        user_id: userId,
        metrics: metricsData,
        analysis_type: 'productivity_score'
      }
    });
  } catch (error) {
    console.error('Error updating productivity score with AI:', error);
  }
};

export const useProductivityScore = (): ProductivityMetrics => {
  const { user } = useAuth();
  const { 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount, 
    habitsData, 
    focusData,
    activityData 
  } = useAnalyticsData();

  return useMemo(() => {
    let totalPossibleScore = 0;
    let earnedScore = 0;
    
    // Score de complétion des tâches (0-20 points) - seulement si des tâches existent
    let completionScore = 0;
    const hasTaskData = taskCompletionRate > 0 || activityData.some(day => day.count > 0);
    if (hasTaskData) {
      completionScore = Math.min(20, (taskCompletionRate / 100) * 20);
      totalPossibleScore += 20;
      earnedScore += completionScore;
    }
    
    // Score de temps de focus (0-20 points) - seulement si des sessions focus existent
    let focusTimeScore = 0;
    const hasFocusData = totalFocusTime > 0 || focusData.some(session => session.minutes > 0);
    if (hasFocusData) {
      const dailyFocusTarget = 120;
      const avgDailyFocus = totalFocusTime / 7;
      focusTimeScore = Math.min(20, (avgDailyFocus / dailyFocusTarget) * 20);
      totalPossibleScore += 20;
      earnedScore += focusTimeScore;
    }
    
    // Score de consistance des habitudes (0-15 points) - seulement si des habitudes existent
    let consistencyScore = 0;
    const hasHabitsData = habitsData.length > 0 && habitsData.some(habit => habit.value > 0);
    if (hasHabitsData) {
      const avgHabitStreak = habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length;
      consistencyScore = Math.min(15, (avgHabitStreak / 21) * 15);
      totalPossibleScore += 15;
      earnedScore += consistencyScore;
    }
    
    // Score de qualité basé sur la régularité des sessions (0-10 points)
    let qualityScore = 0;
    if (hasFocusData) {
      const recentSessions = focusData.slice(-7);
      const sessionConsistency = recentSessions.filter(session => session.minutes > 0).length;
      qualityScore = Math.min(10, (sessionConsistency / 7) * 10);
      totalPossibleScore += 10;
      earnedScore += qualityScore;
    }
    
    // Score de gestion du temps basé sur l'activité quotidienne (0-10 points)
    let timeManagementScore = 0;
    const recentActivity = activityData.slice(-7).reduce((sum, day) => sum + day.count, 0);
    if (recentActivity > 0) {
      timeManagementScore = Math.min(10, (recentActivity / 28) * 10);
      totalPossibleScore += 10;
      earnedScore += timeManagementScore;
    }
    
    // Score journal basé sur la régularité d'écriture (0-10 points)
    let journalScore = 0;
    const journalActivity = activityData.filter(day => day.count > 0).length;
    if (journalActivity > 0) {
      journalScore = Math.min(10, (journalActivity / 7) * 10);
      totalPossibleScore += 10;
      earnedScore += journalScore;
    }
    
    // Score objectifs (0-10 points) - basé sur les streaks
    let goalScore = 0;
    if (streakCount > 0) {
      goalScore = Math.min(10, (streakCount / 30) * 10);
      totalPossibleScore += 10;
      earnedScore += goalScore;
    }
    
    // Bonus de série globale (0-5 points)
    let streakBonus = 0;
    if (streakCount > 0) {
      streakBonus = Math.min(5, (streakCount / 50) * 5);
      totalPossibleScore += 5;
      earnedScore += streakBonus;
    }
    
    // Score total calculé proportionnellement aux données disponibles
    const totalScore = totalPossibleScore > 0 ? Math.round((earnedScore / totalPossibleScore) * 100) : 0;
    
    // Déterminer le niveau avec plus de granularité
    let level = 'Novice';
    if (totalScore >= 95) level = 'Légende Absolue';
    else if (totalScore >= 90) level = 'Maître Zen';
    else if (totalScore >= 85) level = 'Expert Suprême';
    else if (totalScore >= 80) level = 'Expert';
    else if (totalScore >= 75) level = 'Avancé Élite';
    else if (totalScore >= 70) level = 'Avancé+';
    else if (totalScore >= 65) level = 'Avancé';
    else if (totalScore >= 60) level = 'Intermédiaire Pro';
    else if (totalScore >= 55) level = 'Intermédiaire+';
    else if (totalScore >= 50) level = 'Intermédiaire';
    else if (totalScore >= 45) level = 'Apprenti+';
    else if (totalScore >= 40) level = 'Apprenti';
    else if (totalScore >= 35) level = 'Débutant+';
    else if (totalScore >= 30) level = 'Débutant';
    
    // Badges basés sur les données disponibles
    const badges: string[] = [];
    
    // Badges de complétion de tâches
    if (hasTaskData) {
      if (taskCompletionRate >= 98) badges.push('Perfectionniste Ultime');
      else if (taskCompletionRate >= 90) badges.push('Super Organisé');
      else if (taskCompletionRate >= 80) badges.push('Bien Organisé');
      else if (taskCompletionRate >= 70) badges.push('Organisé');
    }
    
    // Badges de focus
    if (hasFocusData) {
      const avgDailyFocus = totalFocusTime / 7;
      if (avgDailyFocus >= 480) badges.push('Moine Shaolin');
      else if (avgDailyFocus >= 300) badges.push('Concentré Extrême');
      else if (avgDailyFocus >= 180) badges.push('Super Focalisé');
      else if (avgDailyFocus >= 120) badges.push('Focalisé');
      else if (avgDailyFocus >= 60) badges.push('En Concentration');
    }
    
    // Badges de consistance/streaks
    if (streakCount > 0) {
      if (streakCount >= 365) badges.push('Légende Immortelle');
      else if (streakCount >= 180) badges.push('Titan de la Discipline');
      else if (streakCount >= 100) badges.push('Centurion');
      else if (streakCount >= 50) badges.push('Persévérant Suprême');
      else if (streakCount >= 30) badges.push('Persévérant');
      else if (streakCount >= 14) badges.push('Régulier');
      else if (streakCount >= 7) badges.push('Motivé');
      else if (streakCount >= 3) badges.push('Démarrage');
    }
    
    // Badges d'habitudes
    if (hasHabitsData) {
      const avgHabitStreak = habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length;
      if (avgHabitStreak >= 30) badges.push('Maître des Habitudes');
      else if (avgHabitStreak >= 21) badges.push('Architecte d\'Habitudes');
      else if (avgHabitStreak >= 14) badges.push('Discipliné');
      else if (avgHabitStreak >= 7) badges.push('Constant');
      else if (avgHabitStreak >= 3) badges.push('En Progression');
    }
    
    // Badges de niveau global (seulement si on a des données)
    if (totalPossibleScore > 0) {
      if (totalScore >= 95) badges.push('Transcendance Totale');
      else if (totalScore >= 90) badges.push('Maître de la Productivité');
      else if (totalScore >= 85) badges.push('Expert Productif');
      else if (totalScore >= 80) badges.push('Productif Avancé');
      else if (totalScore >= 70) badges.push('Très Productif');
      else if (totalScore >= 60) badges.push('Productif');
      else if (totalScore >= 50) badges.push('En Développement');
    }

    // Mettre à jour le score via l'IA si l'utilisateur est connecté
    if (user && totalPossibleScore > 0) {
      const metricsData = {
        score: totalScore,
        level,
        badges,
        completionRate: taskCompletionRate,
        focusTimeScore,
        consistencyScore,
        qualityScore,
        timeManagementScore,
        journalScore,
        goalScore,
        streakBonus
      };
      
      // Appel asynchrone sans bloquer le rendu
      updateProductivityScoreWithAI(user.id, metricsData);
    }
    
    return {
      score: totalScore,
      level,
      badges: [...new Set(badges)],
      streakBonus,
      completionRate: taskCompletionRate,
      focusTimeScore,
      consistencyScore,
      qualityScore,
      timeManagementScore,
      journalScore,
      goalScore
    };
  }, [taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData, user]);
};
