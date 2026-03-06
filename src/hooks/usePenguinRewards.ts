import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFoodNotification } from "@/components/penguin/FoodNotification";

export type FoodType = 'shrimp' | 'salmon' | 'golden_fish';

const FOOD_LABELS: Record<FoodType, { emoji: string; label: string }> = {
  shrimp: { emoji: '🦐', label: 'Crevette' },
  salmon: { emoji: '🐟', label: 'Saumon' },
  golden_fish: { emoji: '✨🐠', label: 'Poisson Doré' },
};

// Cooldown to prevent duplicate rewards from rapid clicks
const REWARD_COOLDOWN_MS = 2000;

export const usePenguinRewards = () => {
  const queryClient = useQueryClient();
  const { showFood, showEvolution } = useFoodNotification();
  const lastRewardTime = useRef<Record<string, number>>({});

  const feedPenguin = useCallback(async (foodType: FoodType, source: string) => {
    try {
      // Prevent duplicate rewards within cooldown window
      const key = `${foodType}_${source}`;
      const now = Date.now();
      if (lastRewardTime.current[key] && now - lastRewardTime.current[key] < REWARD_COOLDOWN_MS) {
        return;
      }
      lastRewardTime.current[key] = now;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("penguin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const today = new Date().toISOString().split('T')[0];
      const needsReset = profile.last_shrimp_reset !== today;

      // Check shrimp stomach limit
      if (foodType === 'shrimp') {
        const currentToday = needsReset ? 0 : profile.shrimp_today;
        if (currentToday >= profile.shrimp_daily_limit) {
          showFood('shrimp', "Estomac plein ! Cherche du saumon 🐟");
          return;
        }
      }

      // Log the food
      await supabase.from("penguin_food_log").insert({
        user_id: user.id,
        food_type: foodType,
        source,
      });

      // Update profile stats
      const updates: Record<string, unknown> = {
        [`${foodType}_total`]: (profile as Record<string, unknown>)[`${foodType}_total`] as number + 1,
      };

      if (foodType === 'shrimp') {
        if (needsReset) {
          updates.shrimp_today = 1;
          updates.last_shrimp_reset = today;
        } else {
          updates.shrimp_today = profile.shrimp_today + 1;
        }
      }

      // Check evolution
      const newTotals = {
        shrimp_total: (profile.shrimp_total + (foodType === 'shrimp' ? 1 : 0)),
        salmon_total: (profile.salmon_total + (foodType === 'salmon' ? 1 : 0)),
        golden_fish_total: (profile.golden_fish_total + (foodType === 'golden_fish' ? 1 : 0)),
      };

      let evolved = false;
      if (profile.stage === 'egg' && newTotals.salmon_total >= 5) {
        updates.stage = 'chick';
        evolved = true;
      } else if (profile.stage === 'chick' && newTotals.salmon_total >= 30) {
        updates.stage = 'explorer';
        evolved = true;
      } else if (profile.stage === 'explorer' && newTotals.salmon_total >= 100 && newTotals.golden_fish_total >= 10) {
        updates.stage = 'emperor';
        evolved = true;
      }

      // Grow iceberg with salmon
      if (foodType === 'salmon' && newTotals.salmon_total % 10 === 0) {
        updates.iceberg_size = profile.iceberg_size + 1;
      }

      await supabase
        .from("penguin_profiles")
        .update(updates)
        .eq("user_id", user.id);

      const food = FOOD_LABELS[foodType];
      showFood(foodType, `${food.emoji} ${food.label} obtenu${foodType === 'shrimp' ? 'e' : ''} !`);

      if (evolved) {
        const stageNames = { chick: 'Poussin', explorer: 'Explorateur', emperor: 'Empereur' };
        setTimeout(() => showEvolution(stageNames[updates.stage as keyof typeof stageNames] || ''), 600);
      }

      queryClient.invalidateQueries({ queryKey: ["penguin-profile"] });
    } catch (error) {
      console.error("Error feeding penguin:", error);
    }
  }, [queryClient, showFood, showEvolution]);

  // Map actions to food rewards — one shrimp per habit completion, golden fish only for 7+ day streaks
  const rewardTaskComplete = useCallback(() => feedPenguin('shrimp', 'task_completed'), [feedPenguin]);
  const rewardFocusSession = useCallback((minutes: number) => {
    if (minutes >= 60) feedPenguin('salmon', 'focus_deep_work');
    else feedPenguin('shrimp', 'focus_session');
  }, [feedPenguin]);
  const rewardHabitComplete = useCallback(() => feedPenguin('shrimp', 'habit_completed'), [feedPenguin]);
  const rewardStreak = useCallback((days: number) => {
    // Only reward golden fish for meaningful streaks, not every completion
    if (days > 0 && days % 7 === 0) feedPenguin('golden_fish', `streak_${days}`);
  }, [feedPenguin]);
  const rewardJournalEntry = useCallback(() => feedPenguin('shrimp', 'journal_entry'), [feedPenguin]);

  return {
    feedPenguin,
    rewardTaskComplete,
    rewardFocusSession,
    rewardHabitComplete,
    rewardStreak,
    rewardJournalEntry,
    FOOD_LABELS,
  };
};
