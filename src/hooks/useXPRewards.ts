import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// XP rewards for different actions
const XP_REWARDS = {
  task_completed: 10,
  habit_completed: 15,
  focus_session_completed: 20,
  journal_entry_created: 15,
  goal_completed: 50,
  streak_milestone_3: 25,
  streak_milestone_7: 50,
  streak_milestone_30: 200,
};

export const useXPRewards = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const awardXP = useMutation({
    mutationFn: async ({ action, amount }: { action: keyof typeof XP_REWARDS | string; amount?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const xpToAdd = amount || XP_REWARDS[action as keyof typeof XP_REWARDS] || 10;

      const { data: profile, error: fetchError } = await supabase
        .from("player_profiles")
        .select("experience_points, level")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !profile) {
        // Create profile if not exists
        const { error: createError } = await supabase
          .from("player_profiles")
          .insert({ user_id: user.id, experience_points: xpToAdd });
        
        if (createError) throw createError;
        return { xp: xpToAdd, newLevel: null };
      }

      const newXP = profile.experience_points + xpToAdd;
      const xpForNextLevel = 100 * profile.level * profile.level;
      const leveledUp = newXP >= xpForNextLevel;

      const { error: updateError } = await supabase
        .from("player_profiles")
        .update({ experience_points: newXP })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return { 
        xp: xpToAdd, 
        newLevel: leveledUp ? profile.level + 1 : null,
        totalXP: newXP 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      
      if (data.newLevel) {
        toast({
          title: `🎉 Niveau ${data.newLevel} atteint !`,
          description: `Félicitations ! Vous avez gagné +${data.xp} XP`,
        });
      }
    },
    onError: (error) => {
      console.error("Error awarding XP:", error);
    },
  });

  const awardCredits = useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("player_profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase
        .from("player_profiles")
        .update({ credits: profile.credits + amount })
        .eq("user_id", user.id);

      if (error) throw error;
      return amount;
    },
    onSuccess: (amount) => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      toast({
        title: "💰 Crédits gagnés !",
        description: `+${amount} crédits ajoutés`,
      });
    },
  });

  return {
    awardXP: (action: keyof typeof XP_REWARDS | string, amount?: number) => 
      awardXP.mutate({ action, amount }),
    awardCredits: awardCredits.mutate,
    isAwarding: awardXP.isPending || awardCredits.isPending,
    XP_REWARDS,
  };
};
