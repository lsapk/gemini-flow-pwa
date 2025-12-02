import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAchievements } from "./useAchievements";

export const useAchievementTracking = () => {
  const { unlockAchievement } = useAchievements();

  // Suivre les sessions de focus
  const { data: focusCount } = useQuery({
    queryKey: ["focus-sessions-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("focus_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("completed_at", "is", null);

      if (error) throw error;
      return count || 0;
    },
  });

  // Suivre les streaks d'habitudes
  const { data: maxStreak } = useQuery({
    queryKey: ["habits-max-streak"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from("habits")
        .select("streak")
        .eq("user_id", user.id)
        .order("streak", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.streak || 0;
    },
  });

  // Débloquer achievements pour focus
  useEffect(() => {
    if (focusCount && focusCount >= 5) {
      unlockAchievement("focus_warrior");
    }
  }, [focusCount, unlockAchievement]);

  // Débloquer achievements pour habitudes
  useEffect(() => {
    if (maxStreak && maxStreak >= 7) {
      unlockAchievement("habit_builder");
    }
  }, [maxStreak, unlockAchievement]);

  return { focusCount, maxStreak };
};
