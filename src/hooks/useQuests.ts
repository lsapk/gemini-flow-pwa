import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  quest_type: "daily" | "weekly" | "achievement";
  category: "tasks" | "habits" | "focus" | "journal";
  target_value: number;
  current_progress: number;
  reward_xp: number;
  reward_credits: number;
  completed: boolean;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const useQuests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quests, isLoading } = useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quest[];
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ questId, progress }: { questId: string; progress: number }) => {
      const { error } = await supabase
        .from("quests")
        .update({ 
          current_progress: progress,
          completed: progress >= (quests?.find(q => q.id === questId)?.target_value || 0),
          completed_at: progress >= (quests?.find(q => q.id === questId)?.target_value || 0) ? new Date().toISOString() : null
        })
        .eq("id", questId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
    },
  });

  const completeQuest = useMutation({
    mutationFn: async (questId: string) => {
      const quest = quests?.find(q => q.id === questId);
      if (!quest) throw new Error("Quest not found");

      // Mark quest as completed
      const { error: questError } = await supabase
        .from("quests")
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq("id", questId);

      if (questError) throw questError;

      // Add XP and credits to player profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("player_profiles")
        .select("experience_points, credits, total_quests_completed")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const { error: profileError } = await supabase
          .from("player_profiles")
          .update({
            experience_points: profile.experience_points + quest.reward_xp,
            credits: profile.credits + quest.reward_credits,
            total_quests_completed: profile.total_quests_completed + 1,
          })
          .eq("user_id", user.id);

        if (profileError) throw profileError;
      }

      return quest;
    },
    onSuccess: (quest) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      
      toast({
        title: "🎯 Quête Terminée !",
        description: `+${quest.reward_xp} XP | +${quest.reward_credits} Crédits`,
      });
    },
  });

  const activeQuests = quests?.filter(q => !q.completed) || [];
  const completedQuests = quests?.filter(q => q.completed) || [];

  return {
    quests: activeQuests,
    completedQuests,
    isLoading,
    updateProgress: updateProgress.mutate,
    completeQuest: completeQuest.mutate,
  };
};