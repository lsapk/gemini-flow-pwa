
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
  journalScore: number;
  goalScore: number;
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
    // Score de complétion des tâches (0-20 points)
    const completionScore = Math.min(20, (taskCompletionRate / 100) * 20);
    
    // Score de temps de focus (0-20 points) - basé sur 120min par jour
    const dailyFocusTarget = 120;
    const avgDailyFocus = totalFocusTime / 7;
    const focusTimeScore = Math.min(20, (avgDailyFocus / dailyFocusTarget) * 20);
    
    // Score de consistance des habitudes (0-15 points)
    const avgHabitStreak = habitsData.length > 0 
      ? habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length
      : 0;
    const consistencyScore = Math.min(15, (avgHabitStreak / 21) * 15); // 3 semaines cible
    
    // Score de qualité basé sur la régularité des sessions (0-10 points)
    const recentSessions = focusData.slice(-7);
    const sessionConsistency = recentSessions.filter(session => session.minutes > 0).length;
    const qualityScore = Math.min(10, (sessionConsistency / 7) * 10);
    
    // Score de gestion du temps basé sur l'activité quotidienne (0-10 points)
    const recentActivity = activityData.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const timeManagementScore = Math.min(10, (recentActivity / 28) * 10); // 4 activités par jour
    
    // Score journal basé sur la régularité d'écriture (0-10 points)
    const journalActivity = activityData.filter(day => day.count > 0).length;
    const journalScore = Math.min(10, (journalActivity / 7) * 10);
    
    // Score objectifs (0-10 points) - simulé pour le moment
    const goalScore = Math.min(10, (streakCount / 30) * 10);
    
    // Bonus de série globale (0-5 points)
    const streakBonus = Math.min(5, (streakCount / 50) * 5);
    
    // Score total sur 100
    const totalScore = Math.round(
      completionScore + 
      focusTimeScore + 
      consistencyScore + 
      qualityScore + 
      timeManagementScore + 
      journalScore +
      goalScore +
      streakBonus
    );
    
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
    
    // Badges plus sophistiqués et réalistes
    const badges: string[] = [];
    
    // Badges de complétion de tâches
    if (taskCompletionRate >= 98) badges.push('Perfectionniste Ultime');
    else if (taskCompletionRate >= 90) badges.push('Super Organisé');
    else if (taskCompletionRate >= 80) badges.push('Bien Organisé');
    else if (taskCompletionRate >= 70) badges.push('Organisé');
    
    // Badges de focus
    if (avgDailyFocus >= 480) badges.push('Moine Shaolin'); // 8h+
    else if (avgDailyFocus >= 300) badges.push('Concentré Extrême'); // 5h+
    else if (avgDailyFocus >= 180) badges.push('Super Focalisé'); // 3h+
    else if (avgDailyFocus >= 120) badges.push('Focalisé'); // 2h+
    else if (avgDailyFocus >= 60) badges.push('En Concentration'); // 1h+
    
    // Badges de consistance/streaks
    if (streakCount >= 365) badges.push('Légende Immortelle');
    else if (streakCount >= 180) badges.push('Titan de la Discipline');
    else if (streakCount >= 100) badges.push('Centurion');
    else if (streakCount >= 50) badges.push('Persévérant Suprême');
    else if (streakCount >= 30) badges.push('Persévérant');
    else if (streakCount >= 14) badges.push('Régulier');
    else if (streakCount >= 7) badges.push('Motivé');
    else if (streakCount >= 3) badges.push('Démarrage');
    
    // Badges d'habitudes
    if (avgHabitStreak >= 30) badges.push('Maître des Habitudes');
    else if (avgHabitStreak >= 21) badges.push('Architecte d\'Habitudes');
    else if (avgHabitStreak >= 14) badges.push('Discipliné');
    else if (avgHabitStreak >= 7) badges.push('Constant');
    else if (avgHabitStreak >= 3) badges.push('En Progression');
    
    // Badges de niveau global
    if (totalScore >= 95) badges.push('Transcendance Totale');
    else if (totalScore >= 90) badges.push('Maître de la Productivité');
    else if (totalScore >= 85) badges.push('Expert Productif');
    else if (totalScore >= 80) badges.push('Productif Avancé');
    else if (totalScore >= 70) badges.push('Très Productif');
    else if (totalScore >= 60) badges.push('Productif');
    else if (totalScore >= 50) badges.push('En Développement');
    
    // Badges spéciaux basés sur la qualité
    if (sessionConsistency === 7) badges.push('Semaine Parfaite');
    if (sessionConsistency >= 5) badges.push('Très Régulier');
    if (recentActivity >= 35) badges.push('Hyperactif');
    else if (recentActivity >= 21) badges.push('Super Actif');
    else if (recentActivity >= 14) badges.push('Actif');
    
    // Badges de combinaison avancés
    if (taskCompletionRate >= 85 && avgDailyFocus >= 120 && avgHabitStreak >= 14) {
      badges.push('Trinity Master');
    }
    
    if (totalScore >= 80 && streakCount >= 30) {
      badges.push('Élite Constante');
    }
    
    // Badge pour équilibre
    if (completionScore >= 15 && focusTimeScore >= 15 && consistencyScore >= 10) {
      badges.push('Équilibré Suprême');
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
      timeManagementScore,
      journalScore,
      goalScore
    };
  }, [taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData]);
};
