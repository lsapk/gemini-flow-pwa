
import { useMemo } from 'react';
import { useAnalyticsData } from './useAnalyticsData';

export interface ProductivityMetrics {
  score: number;
  level: string;
  badges: string[];
  streakBonus: number;
  completionRate: number;
  focusTimeScore: number;
  consistencyScore: number;
}

export const useProductivityScore = (): ProductivityMetrics => {
  const { 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount, 
    habitsData, 
    focusData,
    activityData 
  } = useAnalyticsData();

  return useMemo(() => {
    // Score de complétion des tâches (0-30 points)
    const completionScore = Math.min(30, (taskCompletionRate / 100) * 30);
    
    // Score de temps de focus (0-25 points)
    const dailyFocusTarget = 120; // 2 heures par jour
    const focusTimeScore = Math.min(25, (totalFocusTime / dailyFocusTarget) * 25);
    
    // Score de consistance des habitudes (0-25 points)
    const avgStreak = habitsData.length > 0 
      ? habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length
      : 0;
    const consistencyScore = Math.min(25, (avgStreak / 7) * 25);
    
    // Bonus de série (0-20 points)
    const streakBonus = Math.min(20, (streakCount / 30) * 20);
    
    // Score total sur 100
    const totalScore = Math.round(completionScore + focusTimeScore + consistencyScore + streakBonus);
    
    // Déterminer le niveau
    let level = 'Débutant';
    if (totalScore >= 80) level = 'Expert';
    else if (totalScore >= 60) level = 'Avancé';
    else if (totalScore >= 40) level = 'Intermédiaire';
    
    // Badges basés sur les accomplissements
    const badges: string[] = [];
    
    if (taskCompletionRate >= 90) badges.push('Perfectionniste');
    if (taskCompletionRate >= 70) badges.push('Organisé');
    if (totalFocusTime >= 300) badges.push('Concentré'); // 5h+
    if (totalFocusTime >= 120) badges.push('Focalisé'); // 2h+
    if (streakCount >= 30) badges.push('Persévérant');
    if (streakCount >= 7) badges.push('Régulier');
    if (avgStreak >= 5) badges.push('Discipliné');
    if (totalScore >= 80) badges.push('Maître de la Productivité');
    if (totalScore >= 60) badges.push('Productif');
    
    // Badges de consistance
    const recentActivity = activityData.slice(-7).reduce((sum, day) => sum + day.count, 0);
    if (recentActivity >= 21) badges.push('Super Actif');
    if (recentActivity >= 14) badges.push('Actif');
    
    return {
      score: totalScore,
      level,
      badges: [...new Set(badges)], // Éviter les doublons
      streakBonus,
      completionRate: taskCompletionRate,
      focusTimeScore,
      consistencyScore
    };
  }, [taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData]);
};
