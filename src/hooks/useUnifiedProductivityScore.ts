import { useMemo } from "react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

/**
 * Unified productivity score used across Dashboard and Analysis.
 * Formula: 40% tasks + 30% focus + 20% streaks + 10% habits
 */
export function useUnifiedProductivityScore() {
  const {
    taskCompletionRate,
    totalFocusTime,
    streakCount,
    habitsData,
    tasksData,
    focusData,
    activityData,
    isLoading,
    refetch,
  } = useAnalyticsData();

  const activeHabits = habitsData?.length || 0;

  const scores = useMemo(() => {
    const taskScore = Math.min(100, Math.round(taskCompletionRate || 0));
    // Focus: 5h (300 min) = 100%
    const focusScore = Math.min(100, Math.round(((totalFocusTime || 0) / 300) * 100));
    // Streak: 10 jours = 100%
    const habitScore = Math.min(100, (streakCount || 0) * 10);
    // Habits: 10 habitudes actives = 100%
    const habitsActiveScore = Math.min(100, activeHabits * 10);

    // Weighted overall
    const overall = Math.round(
      taskScore * 0.4 +
      focusScore * 0.3 +
      habitScore * 0.2 +
      habitsActiveScore * 0.1
    );

    return { taskScore, focusScore, habitScore, habitsActiveScore, overall };
  }, [taskCompletionRate, totalFocusTime, streakCount, activeHabits]);

  const level = useMemo(() => {
    if (scores.overall >= 80) return { label: "Excellent", color: "text-green-500" };
    if (scores.overall >= 60) return { label: "Bon", color: "text-primary" };
    if (scores.overall >= 40) return { label: "Moyen", color: "text-amber-500" };
    return { label: "À améliorer", color: "text-muted-foreground" };
  }, [scores.overall]);

  return {
    scores,
    level,
    taskCompletionRate,
    totalFocusTime,
    streakCount,
    activeHabits,
    habitsData,
    tasksData,
    focusData,
    activityData,
    isLoading,
    refetch,
  };
}
