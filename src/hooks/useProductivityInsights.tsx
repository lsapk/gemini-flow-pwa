
import { useMemo } from 'react';
import { useAnalyticsData } from './useAnalyticsData';
import { 
  TrendingUp, TrendingDown, Clock, Target, 
  Calendar, Zap, AlertTriangle, CheckCircle 
} from 'lucide-react';

export interface ProductivityInsight {
  id: string;
  title: string;
  insight: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  icon: any;
  metric?: string;
}

export const useProductivityInsights = (): ProductivityInsight[] => {
  const { 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount, 
    habitsData, 
    focusData,
    activityData 
  } = useAnalyticsData();

  return useMemo(() => {
    const insights: ProductivityInsight[] = [];

    // Analyse du taux de complétion des tâches
    if (taskCompletionRate < 50) {
      insights.push({
        id: 'low-completion',
        title: 'Taux de complétion faible',
        insight: `Votre taux de complétion des tâches est de ${taskCompletionRate.toFixed(0)}%, ce qui indique des difficultés d'organisation.`,
        recommendation: 'Essayez de diviser vos tâches en sous-tâches plus petites et définissez des priorités claires.',
        priority: 'high',
        icon: AlertTriangle,
        metric: `${taskCompletionRate.toFixed(0)}%`
      });
    } else if (taskCompletionRate >= 80) {
      insights.push({
        id: 'high-completion',
        title: 'Excellente organisation',
        insight: `Votre taux de complétion de ${taskCompletionRate.toFixed(0)}% montre une excellente gestion des tâches.`,
        recommendation: 'Continuez sur cette lancée et challengez-vous avec des objectifs plus ambitieux.',
        priority: 'low',
        icon: CheckCircle,
        metric: `${taskCompletionRate.toFixed(0)}%`
      });
    }

    // Analyse du temps de focus
    const dailyFocusAverage = totalFocusTime / 7;
    if (dailyFocusAverage < 30) {
      insights.push({
        id: 'low-focus',
        title: 'Temps de concentration insuffisant',
        insight: `Vous ne focalisez que ${dailyFocusAverage.toFixed(0)} minutes par jour en moyenne.`,
        recommendation: 'Planifiez au moins 2 sessions de 25 minutes par jour. Utilisez la technique Pomodoro.',
        priority: 'high',
        icon: Clock,
        metric: `${dailyFocusAverage.toFixed(0)}min/jour`
      });
    } else if (dailyFocusAverage >= 120) {
      insights.push({
        id: 'high-focus',
        title: 'Concentration exceptionnelle',
        insight: `Votre moyenne de ${dailyFocusAverage.toFixed(0)} minutes de focus par jour est remarquable.`,
        recommendation: 'Maintenez cette habitude et veillez à prendre des pauses régulières.',
        priority: 'low',
        icon: Zap,
        metric: `${dailyFocusAverage.toFixed(0)}min/jour`
      });
    }

    // Analyse des habitudes
    const avgStreakDays = habitsData.length > 0 
      ? habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length
      : 0;

    if (avgStreakDays < 3 && habitsData.length > 0) {
      insights.push({
        id: 'weak-habits',
        title: 'Habitudes instables',
        insight: `Vos séries d'habitudes moyennes sont de ${avgStreakDays.toFixed(1)} jours.`,
        recommendation: 'Concentrez-vous sur 1-2 habitudes maximum et soyez constant pendant 21 jours.',
        priority: 'medium',
        icon: TrendingDown,
        metric: `${avgStreakDays.toFixed(1)} jours`
      });
    } else if (avgStreakDays >= 7) {
      insights.push({
        id: 'strong-habits',
        title: 'Habitudes solides',
        insight: `Vos séries d'habitudes de ${avgStreakDays.toFixed(1)} jours montrent une belle discipline.`,
        recommendation: 'Ajoutez progressivement une nouvelle habitude à votre routine.',
        priority: 'low',
        icon: TrendingUp,
        metric: `${avgStreakDays.toFixed(1)} jours`
      });
    }

    // Analyse de la consistance
    const recentActivity = activityData.slice(-7).reduce((sum, day) => sum + day.count, 0);
    if (recentActivity < 7) {
      insights.push({
        id: 'low-activity',
        title: 'Activité faible cette semaine',
        insight: `Seulement ${recentActivity} activités cette semaine. La régularité est clé pour la productivité.`,
        recommendation: 'Établissez une routine quotidienne et planifiez au moins 2 activités par jour.',
        priority: 'medium',
        icon: Calendar,
        metric: `${recentActivity} activités`
      });
    }

    // Analyse du meilleur jour
    const bestDay = focusData.reduce((best, day) => 
      day.minutes > best.minutes ? day : best, focusData[0] || { date: '', minutes: 0 });
    
    if (bestDay.minutes > 60) {
      insights.push({
        id: 'best-day',
        title: 'Jour de performance',
        insight: `Le ${bestDay.date} était votre meilleur jour avec ${bestDay.minutes} minutes de focus.`,
        recommendation: 'Analysez ce qui a rendu cette journée productive et reproduisez ces conditions.',
        priority: 'low',
        icon: Target,
        metric: `${bestDay.minutes}min`
      });
    }

    return insights.slice(0, 6); // Limiter à 6 insights max
  }, [taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData]);
};
