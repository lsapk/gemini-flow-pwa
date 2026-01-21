import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useXPNotification } from "@/components/gamification/XPNotification";

// XP rewards configuration
const XP_CONFIG = {
  task_completed: { xp: 10, message: "Tâche" },
  task_high_priority: { xp: 20, message: "Priorité haute" },
  habit_completed: { xp: 15, message: "Habitude" },
  focus_session_mini: { xp: 15, message: "Focus 15min" },
  focus_session_pomodoro: { xp: 25, message: "Pomodoro" },
  focus_session_long: { xp: 40, message: "Deep work" },
  journal_entry: { xp: 20, message: "Journal" },
  goal_completed: { xp: 100, message: "Objectif" },
  streak_3: { xp: 30, message: "Streak 3j" },
  streak_7: { xp: 75, message: "Streak 7j" },
  streak_30: { xp: 300, message: "Streak 30j" },
};

export type RewardAction = keyof typeof XP_CONFIG;

export const useGamificationRewards = () => {
  const queryClient = useQueryClient();
  const { showXP, showLevelUp, showCredits } = useXPNotification();

  // Get active XP multiplier from power-ups
  const getActiveXPMultiplier = useCallback(async (userId: string): Promise<number> => {
    try {
      const { data: activePowerUps } = await supabase
        .from("active_powerups")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString());

      if (!activePowerUps) return 1;

      const xpBoost = activePowerUps.find(
        (p) => p.powerup_type === "xp_boost_2x" || p.powerup_type === "xp_boost_3x"
      );

      return xpBoost?.multiplier || 1;
    } catch {
      return 1;
    }
  }, []);

  const awardXP = useCallback(async (action: RewardAction, customAmount?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const config = XP_CONFIG[action];
      let xpToAdd = customAmount || config.xp;

      // Apply XP multiplier from active power-ups
      const multiplier = await getActiveXPMultiplier(user.id);
      xpToAdd = Math.floor(xpToAdd * multiplier);

      // Get current profile
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("experience_points, level, credits")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const newXP = profile.experience_points + xpToAdd;
      const xpForNextLevel = 100 * profile.level * profile.level;
      const leveledUp = newXP >= xpForNextLevel;
      const newLevel = leveledUp ? profile.level + 1 : profile.level;
      const bonusCredits = leveledUp ? newLevel * 10 : 0;

      // Update profile
      await supabase
        .from("player_profiles")
        .update({ 
          experience_points: newXP,
          level: newLevel,
          credits: profile.credits + bonusCredits
        })
        .eq("user_id", user.id);

      // Show notification with multiplier info
      const xpMessage = multiplier > 1 
        ? `${config.message} (x${multiplier})` 
        : config.message;
      showXP(xpToAdd, xpMessage);

      if (leveledUp) {
        setTimeout(() => showLevelUp(newLevel), 500);
        if (bonusCredits > 0) {
          setTimeout(() => showCredits(bonusCredits), 1000);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      queryClient.invalidateQueries({ queryKey: ["quests"] });

    } catch (error) {
      console.error("Error awarding XP:", error);
    }
  }, [queryClient, showXP, showLevelUp, showCredits, getActiveXPMultiplier]);

  // Check if user has active streak protection
  const hasStreakProtection = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: activePowerUps } = await supabase
        .from("active_powerups")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString());

      if (!activePowerUps) return false;

      return activePowerUps.some(
        (p) => p.powerup_type === "streak_shield" || p.powerup_type === "streak_mega_shield"
      );
    } catch {
      return false;
    }
  }, []);

  const checkAndRewardStreak = useCallback(async (streak: number) => {
    if (streak === 3) await awardXP("streak_3");
    else if (streak === 7) await awardXP("streak_7");
    else if (streak === 30) await awardXP("streak_30");
  }, [awardXP]);

  return {
    awardXP,
    checkAndRewardStreak,
    hasStreakProtection,
    XP_CONFIG,
  };
};
