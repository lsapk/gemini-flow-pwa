import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
  created_at: string;
}

export const ACHIEVEMENT_DEFINITIONS = {
  first_quest: {
    id: "first_quest",
    title: "Première Quête",
    description: "Complétez votre première quête",
    icon: "🎯",
  },
  quest_master: {
    id: "quest_master",
    title: "Maître des Quêtes",
    description: "Complétez 10 quêtes",
    icon: "👑",
  },
  focus_warrior: {
    id: "focus_warrior",
    title: "Guerrier du Focus",
    description: "Complétez 5 sessions de focus",
    icon: "⚔️",
  },
  habit_builder: {
    id: "habit_builder",
    title: "Bâtisseur d'Habitudes",
    description: "Maintenez une habitude pendant 7 jours",
    icon: "🔥",
  },
  level_10: {
    id: "level_10",
    title: "Niveau 10 Atteint",
    description: "Atteignez le niveau 10",
    icon: "⭐",
  },
};

export const useAchievements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  const unlockAchievement = useMutation({
    mutationFn: async (achievementId: keyof typeof ACHIEVEMENT_DEFINITIONS) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
      
      const { error } = await supabase
        .from("achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
        });

      if (error) {
        // Si l'achievement existe déjà, ne pas lever d'erreur
        if (error.code === "23505") return null;
        throw error;
      }
      return achievement;
    },
    onSuccess: (achievement) => {
      if (achievement) {
        queryClient.invalidateQueries({ queryKey: ["achievements"] });
        toast({
          title: `${achievement.icon} Achievement Débloqué !`,
          description: `${achievement.title} - ${achievement.description}`,
        });
      }
    },
  });

  return {
    achievements: achievements || [],
    isLoading,
    unlockAchievement: unlockAchievement.mutate,
    isUnlocking: unlockAchievement.isPending,
  };
};
