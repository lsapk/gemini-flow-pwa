import { useAnalyticsData } from "./useAnalyticsData";
import { Brain, Target, Timer, type LucideIcon } from "lucide-react";

export interface ProductivityInsight {
  id: string;
  title: string;
  insight: string;
  recommendation: string;
  description?: string;
  suggestion?: string;
  priority: "high" | "medium" | "low";
  icon: LucideIcon;
  metric?: string;
  category: "performance" | "habits" | "focus" | "motivation" | "optimization";
}

// Deterministic observations, independent from the optional paid AI analysis.
export const useProductivityInsights = (): ProductivityInsight[] => {
  const data = useAnalyticsData();
  if (data.isLoading || data.error) return [];
  const totalTasks = data.tasksData.reduce(
    (sum, group) => sum + group.completed + group.pending,
    0,
  );
  const insights: ProductivityInsight[] = [];
  if (totalTasks)
    insights.push({
      id: "task-completion",
      title: "Tâches enregistrées",
      insight: `${Math.round(data.taskCompletionRate)} % de vos ${totalTasks} tâches sont terminées.`,
      recommendation:
        "Choisissez une tâche prioritaire qui correspond au temps disponible.",
      priority: "medium",
      icon: Target,
      category: "performance",
      metric: `${Math.round(data.taskCompletionRate)} %`,
    });
  if (data.totalFocusTime)
    insights.push({
      id: "focus-recorded",
      title: "Temps de focus enregistré",
      insight: `${data.totalFocusTime} minutes sur les sept derniers jours.`,
      recommendation:
        "Alternez concentration et pauses selon votre niveau d’énergie.",
      priority: "low",
      icon: Timer,
      category: "focus",
      metric: `${data.totalFocusTime} min`,
    });
  if (data.habitsData.length)
    insights.push({
      id: "habits-recorded",
      title: "Votre meilleure série",
      insight: `${data.streakCount} jours pour la meilleure série d’habitude enregistrée.`,
      recommendation:
        "Gardez une habitude simple que vous souhaitez poursuivre.",
      priority: "low",
      icon: Brain,
      category: "habits",
      metric: `${data.streakCount} j`,
    });
  if (!insights.length)
    insights.push({
      id: "no-data",
      title: "Vos premiers repères",
      insight: "Aucune tâche, habitude ou séance enregistrée à analyser.",
      recommendation:
        "Commencez par ajouter une activité qui compte pour vous.",
      priority: "low",
      icon: Target,
      category: "performance",
    });
  return insights.map((insight) => ({
    ...insight,
    description: insight.insight,
    suggestion: insight.recommendation,
  }));
};
