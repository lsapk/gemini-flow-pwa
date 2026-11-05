import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const day = (value: string) => value.slice(0, 10);
const empty = {
  habitsData: [] as { name: string; value: number }[],
  tasksData: [] as { name: string; completed: number; pending: number }[],
  focusData: [] as { date: string; minutes: number }[],
  activityData: [] as { date: string; count: number }[],
  taskCompletionRate: 0,
  totalFocusTime: 0,
  streakCount: 0,
};

export const useAnalyticsData = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) throw new Error("Connexion requise");
      const now = new Date();
      const dates = Array.from({ length: 7 }, (_, i) =>
        new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 6 + i,
          ),
        )
          .toISOString()
          .slice(0, 10),
      );
      const from = `${dates[0]}T00:00:00Z`;
      const results = await Promise.all([
        supabase
          .from("habits")
          .select("title,streak,updated_at")
          .eq("user_id", user.id),
        supabase
          .from("tasks")
          .select("priority,completed,updated_at")
          .eq("user_id", user.id),
        supabase
          .from("focus_sessions")
          .select("duration,created_at")
          .eq("user_id", user.id)
          .gte("created_at", from),
        supabase
          .from("journal_entries")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", from),
      ]);
      if (results.some((result) => result.error))
        throw new Error("Impossible de charger les statistiques. Réessayez.");
      const [habitsResult, tasksResult, focusResult, journalResult] = results;
      const habits = habitsResult.data ?? [],
        tasks = tasksResult.data ?? [],
        focus = focusResult.data ?? [],
        journal = journalResult.data ?? [];
      const grouped: Record<
        string,
        { name: string; completed: number; pending: number }
      > = {};
      for (const task of tasks) {
        const key = task.priority || "other";
        grouped[key] ??= {
          name:
            (
              { high: "Élevée", medium: "Moyenne", low: "Faible" } as Record<
                string,
                string
              >
            )[key] || "Non définie",
          completed: 0,
          pending: 0,
        };
        grouped[key][task.completed ? "completed" : "pending"]++;
      }
      const focusByDay = Object.fromEntries(dates.map((date) => [date, 0]));
      // focus_sessions.duration is stored in minutes (the Focus page's contract).
      for (const entry of focus)
        if (entry.created_at && day(entry.created_at) in focusByDay)
          focusByDay[day(entry.created_at)] += Math.max(
            0,
            Number(entry.duration) || 0,
          );
      const activityByDay = Object.fromEntries(dates.map((date) => [date, 0]));
      for (const timestamp of [
        ...habits.map((item) => item.updated_at),
        ...tasks.map((item) => item.updated_at),
        ...focus.map((item) => item.created_at),
        ...journal.map((item) => item.created_at),
      ])
        if (timestamp && day(timestamp) in activityByDay)
          activityByDay[day(timestamp)]++;
      return {
        habitsData: habits.map((habit) => ({
          name: habit.title,
          value: Math.max(0, habit.streak || 0),
        })),
        tasksData: Object.values(grouped),
        focusData: dates.map((date) => ({
          date,
          minutes: Math.round(focusByDay[date]),
        })),
        activityData: dates.map((date) => ({
          date,
          count: activityByDay[date],
        })),
        taskCompletionRate: tasks.length
          ? (tasks.filter((task) => task.completed).length / tasks.length) * 100
          : 0,
        totalFocusTime: Math.round(
          Object.values(focusByDay).reduce((sum, value) => sum + value, 0),
        ),
        streakCount: habits.reduce(
          (max, habit) => Math.max(max, habit.streak || 0),
          0,
        ),
      };
    },
  });
  const { refetch: refetchQuery } = query;
  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);
  return {
    ...(query.data ?? empty),
    isLoading: !!user && query.isPending,
    error: query.error?.message ?? null,
    refetch,
  };
};
