
import { useMemo } from 'react';
import { useAnalyticsData } from './useAnalyticsData';
import { 
  TrendingUp, TrendingDown, Clock, Target, 
  Calendar, Zap, AlertTriangle, CheckCircle,
  Brain, Heart, Trophy, Flame
} from 'lucide-react';

export interface ProductivityInsight {
  id: string;
  title: string;
  insight: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  icon: any;
  metric?: string;
  category: 'performance' | 'habits' | 'focus' | 'motivation' | 'optimization';
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
    
    // Calculs préliminaires
    const dailyFocusAverage = totalFocusTime / 7;
    const avgStreakDays = habitsData.length > 0 
      ? habitsData.reduce((sum, habit) => sum + habit.value, 0) / habitsData.length
      : 0;
    const recentActivity = activityData.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const focusConsistency = focusData.filter(day => day.minutes > 0).length;
    
    // Insights de performance
    if (taskCompletionRate < 40) {
      insights.push({
        id: 'critical-completion',
        title: 'Performance critique',
        insight: `Votre taux de complétion de ${taskCompletionRate.toFixed(0)}% nécessite une action immédiate.`,
        recommendation: 'Utilisez la technique des 3 tâches prioritaires par jour. Commencez petit et célébrez chaque victoire.',
        priority: 'high',
        icon: AlertTriangle,
        metric: `${taskCompletionRate.toFixed(0)}%`,
        category: 'performance'
      });
    } else if (taskCompletionRate >= 90) {
      insights.push({
        id: 'exceptional-performance',
        title: 'Performance exceptionnelle',
        insight: `Votre taux de ${taskCompletionRate.toFixed(0)}% vous place dans l'élite des utilisateurs productifs.`,
        recommendation: 'Partagez vos méthodes avec d\'autres et challengez-vous avec des projets plus ambitieux.',
        priority: 'low',
        icon: Trophy,
        metric: `${taskCompletionRate.toFixed(0)}%`,
        category: 'performance'
      });
    } else if (taskCompletionRate < 60) {
      insights.push({
        id: 'improving-completion',
        title: 'Potentiel d\'amélioration',
        insight: `À ${taskCompletionRate.toFixed(0)}%, vous avez une belle marge de progression.`,
        recommendation: 'Analysez vos tâches non terminées et identifiez les obstacles récurrents.',
        priority: 'medium',
        icon: TrendingUp,
        metric: `${taskCompletionRate.toFixed(0)}%`,
        category: 'performance'
      });
    }

    // Insights de focus
    if (dailyFocusAverage < 20) {
      insights.push({
        id: 'focus-deficit',
        title: 'Déficit de concentration',
        insight: `${dailyFocusAverage.toFixed(0)} minutes par jour est insuffisant pour une productivité optimale.`,
        recommendation: 'Commencez par des sessions de 15 minutes. Éliminez les distractions de votre environnement.',
        priority: 'high',
        icon: Brain,
        metric: `${dailyFocusAverage.toFixed(0)}min/jour`,
        category: 'focus'
      });
    } else if (dailyFocusAverage >= 180) {
      insights.push({
        id: 'focus-master',
        title: 'Maître de la concentration',
        insight: `${dailyFocusAverage.toFixed(0)} minutes quotidiennes révèlent une discipline remarquable.`,
        recommendation: 'Variez vos techniques de focus et veillez à maintenir un équilibre vie-travail.',
        priority: 'low',
        icon: Zap,
        metric: `${dailyFocusAverage.toFixed(0)}min/jour`,
        category: 'focus'
      });
    }

    // Insights de consistance
    if (focusConsistency <= 2) {
      insights.push({
        id: 'inconsistent-focus',
        title: 'Focus irrégulier',
        insight: `Seulement ${focusConsistency} jours avec des sessions de focus cette semaine.`,
        recommendation: 'Intégrez 20 minutes de focus dans votre routine matinale quotidienne.',
        priority: 'medium',
        icon: Calendar,
        metric: `${focusConsistency}/7 jours`,
        category: 'habits'
      });
    } else if (focusConsistency === 7) {
      insights.push({
        id: 'perfect-consistency',
        title: 'Consistance parfaite',
        insight: 'Vous avez maintenu des sessions de focus tous les jours cette semaine !',
        recommendation: 'Récompensez-vous et maintenez cette excellente habitude.',
        priority: 'low',
        icon: Flame,
        metric: '7/7 jours',
        category: 'habits'
      });
    }

    // Insights d'habitudes
    if (avgStreakDays < 2 && habitsData.length > 0) {
      insights.push({
        id: 'habit-struggle',
        title: 'Difficultés avec les habitudes',
        insight: `Vos séries moyennes de ${avgStreakDays.toFixed(1)} jours indiquent des difficultés de constance.`,
        recommendation: 'Réduisez à 1-2 habitudes essentielles et utilisez des rappels visuels.',
        priority: 'high',
        icon: TrendingDown,
        metric: `${avgStreakDays.toFixed(1)} jours`,
        category: 'habits'
      });
    } else if (avgStreakDays >= 14) {
      insights.push({
        id: 'habit-champion',
        title: 'Champion des habitudes',
        insight: `${avgStreakDays.toFixed(1)} jours de série moyenne témoignent d'une discipline extraordinaire.`,
        recommendation: 'Documentez votre méthode et envisagez de mentorer d\'autres personnes.',
        priority: 'low',
        icon: Heart,
        metric: `${avgStreakDays.toFixed(1)} jours`,
        category: 'habits'
      });
    }

    // Insights d'activité générale
    if (recentActivity < 10) {
      insights.push({
        id: 'low-engagement',
        title: 'Engagement faible',
        insight: `${recentActivity} activités cette semaine suggèrent un manque d'engagement.`,
        recommendation: 'Planifiez 3 activités minimum par jour et utilisez des récompenses pour vous motiver.',
        priority: 'medium',
        icon: AlertTriangle,
        metric: `${recentActivity} activités`,
        category: 'motivation'
      });
    } else if (recentActivity >= 30) {
      insights.push({
        id: 'high-activity',
        title: 'Très actif',
        insight: `${recentActivity} activités montrent un excellent niveau d'engagement.`,
        recommendation: 'Assurez-vous de prendre des pauses pour éviter le burnout.',
        priority: 'low',
        icon: CheckCircle,
        metric: `${recentActivity} activités`,
        category: 'motivation'
      });
    }

    // Insights d'optimisation
    const weekendActivity = activityData.slice(-2).reduce((sum, day) => sum + day.count, 0);
    const weekdayActivity = activityData.slice(-7, -2).reduce((sum, day) => sum + day.count, 0);
    
    if (weekendActivity > weekdayActivity * 0.6) {
      insights.push({
        id: 'weekend-productivity',
        title: 'Productivité weekend',
        insight: 'Vous êtes plus productif le weekend que les jours de semaine.',
        recommendation: 'Analysez ce qui rend vos weekends productifs et appliquez ces principes en semaine.',
        priority: 'medium',
        icon: Target,
        category: 'optimization'
      });
    }

    // Trier par priorité et limiter le nombre
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return insights
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 8); // Limiter à 8 insights max
  }, [taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData]);
};
