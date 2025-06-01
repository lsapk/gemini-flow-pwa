
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
  qualityScore: number;
  timeManagementScore: number;
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
    // Score de complétion des tâches (0-25 points)
    const completionScore = Math.min(25, (taskCompletionRate / 100) * 25);
    
    // Score de temps de focus (0-20 points)
    const dailyFocusTarget = 120; // 2 heures par jour
    const focusTimeScore = Math.min(20, (totalFocusTime / dailyFocusTarget) * 20);
    
    // Score de consistance des habitudes (0-20 points)
    const avgStreak = habitsData.length > 0 
      ? habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length
      : 0;
    const consistencyScore = Math.min(20, (avgStreak / 10) * 20);
    
    // Score de qualité basé sur la régularité des sessions (0-15 points)
    const recentSessions = focusData.slice(-7);
    const sessionConsistency = recentSessions.filter(session => session.minutes > 0).length;
    const qualityScore = Math.min(15, (sessionConsistency / 7) * 15);
    
    // Score de gestion du temps basé sur l'activité quotidienne (0-10 points)
    const recentActivity = activityData.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const timeManagementScore = Math.min(10, (recentActivity / 35) * 10); // 5 activités par jour en moyenne
    
    // Bonus de série (0-10 points)
    const streakBonus = Math.min(10, (streakCount / 30) * 10);
    
    // Score total sur 100
    const totalScore = Math.round(
      completionScore + 
      focusTimeScore + 
      consistencyScore + 
      qualityScore + 
      timeManagementScore + 
      streakBonus
    );
    
    // Déterminer le niveau avec plus de granularité
    let level = 'Débutant';
    if (totalScore >= 90) level = 'Maître Zen';
    else if (totalScore >= 80) level = 'Expert';
    else if (totalScore >= 70) level = 'Avancé+';
    else if (totalScore >= 60) level = 'Avancé';
    else if (totalScore >= 50) level = 'Intermédiaire+';
    else if (totalScore >= 40) level = 'Intermédiaire';
    else if (totalScore >= 30) level = 'Débutant+';
    
    // Badges plus sophistiqués
    const badges: string[] = [];
    
    // Badges de complétion
    if (taskCompletionRate >= 95) badges.push('Perfectionniste Ultime');
    else if (taskCompletionRate >= 85) badges.push('Super Organisé');
    else if (taskCompletionRate >= 70) badges.push('Bien Organisé');
    
    // Badges de focus
    if (totalFocusTime >= 600) badges.push('Moine Shaolin'); // 10h+
    else if (totalFocusTime >= 300) badges.push('Concentré Extrême'); // 5h+
    else if (totalFocusTime >= 120) badges.push('Focalisé'); // 2h+
    
    // Badges de consistance
    if (streakCount >= 100) badges.push('Légende Immortelle');
    else if (streakCount >= 50) badges.push('Titan de la Discipline');
    else if (streakCount >= 30) badges.push('Persévérant');
    else if (streakCount >= 14) badges.push('Régulier');
    else if (streakCount >= 7) badges.push('Motivé');
    
    // Badges d'habitudes
    if (avgStreak >= 15) badges.push('Maître des Habitudes');
    else if (avgStreak >= 10) badges.push('Discipliné');
    else if (avgStreak >= 5) badges.push('Constant');
    
    // Badges de niveau global
    if (totalScore >= 90) badges.push('Productivité Transcendante');
    else if (totalScore >= 80) badges.push('Maître de la Productivité');
    else if (totalScore >= 70) badges.push('Expert Productif');
    else if (totalScore >= 60) badges.push('Productif Avancé');
    else if (totalScore >= 50) badges.push('Productif');
    
    // Badges spéciaux basés sur la qualité
    if (sessionConsistency === 7) badges.push('Semaine Parfaite');
    if (recentActivity >= 35) badges.push('Hyperactif');
    else if (recentActivity >= 21) badges.push('Super Actif');
    
    // Badges de combinaison
    if (taskCompletionRate >= 80 && totalFocusTime >= 120 && avgStreak >= 7) {
      badges.push('Trinity Master');
    }
    
    return {
      score: totalScore,
      level,
      badges: [...new Set(badges)], // Éviter les doublons
      streakBonus,
      completionRate: taskCompletionRate,
      focusTimeScore,
      consistencyScore,
      qualityScore,
      timeManagementScore
    };
  }, [taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData]);
};
