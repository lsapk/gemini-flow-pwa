import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  // Quests
  first_quest: {
    id: "first_quest",
    title: "Première Quête",
    description: "Complétez votre première quête",
    icon: "🎯",
    xp: 50,
  },
  quest_hunter: {
    id: "quest_hunter",
    title: "Chasseur de Quêtes",
    description: "Complétez 5 quêtes",
    icon: "🏹",
    xp: 100,
  },
  quest_master: {
    id: "quest_master",
    title: "Maître des Quêtes",
    description: "Complétez 25 quêtes",
    icon: "👑",
    xp: 250,
  },
  quest_legend: {
    id: "quest_legend",
    title: "Légende des Quêtes",
    description: "Complétez 100 quêtes",
    icon: "🌟",
    xp: 1000,
  },

  // Focus
  focus_initiate: {
    id: "focus_initiate",
    title: "Initié du Focus",
    description: "Complétez votre première session de focus",
    icon: "🧘",
    xp: 25,
  },
  focus_warrior: {
    id: "focus_warrior",
    title: "Guerrier du Focus",
    description: "Complétez 10 sessions de focus",
    icon: "⚔️",
    xp: 150,
  },
  focus_sage: {
    id: "focus_sage",
    title: "Sage du Focus",
    description: "Accumulez 10 heures de focus",
    icon: "🧙",
    xp: 500,
  },
  focus_transcended: {
    id: "focus_transcended",
    title: "Transcendance du Focus",
    description: "Accumulez 50 heures de focus",
    icon: "✨",
    xp: 2000,
  },

  // Habits
  habit_builder: {
    id: "habit_builder",
    title: "Bâtisseur d'Habitudes",
    description: "Maintenez une habitude pendant 7 jours",
    icon: "🔥",
    xp: 100,
  },
  habit_champion: {
    id: "habit_champion",
    title: "Champion des Habitudes",
    description: "Maintenez une habitude pendant 30 jours",
    icon: "🏆",
    xp: 500,
  },
  habit_immortal: {
    id: "habit_immortal",
    title: "Immortel des Habitudes",
    description: "Maintenez une habitude pendant 100 jours",
    icon: "💎",
    xp: 2000,
  },

  // Levels
  level_5: {
    id: "level_5",
    title: "Niveau 5 Atteint",
    description: "Atteignez le niveau 5",
    icon: "⭐",
    xp: 100,
  },
  level_10: {
    id: "level_10",
    title: "Niveau 10 Atteint",
    description: "Atteignez le niveau 10",
    icon: "🌟",
    xp: 250,
  },
  level_25: {
    id: "level_25",
    title: "Niveau 25 Atteint",
    description: "Atteignez le niveau 25",
    icon: "💫",
    xp: 500,
  },
  level_50: {
    id: "level_50",
    title: "Niveau 50 Atteint",
    description: "Atteignez le niveau 50",
    icon: "🔮",
    xp: 1000,
  },

  // Tasks
  task_slayer: {
    id: "task_slayer",
    title: "Tueur de Tâches",
    description: "Complétez 50 tâches",
    icon: "⚡",
    xp: 200,
  },
  task_destroyer: {
    id: "task_destroyer",
    title: "Destructeur de Tâches",
    description: "Complétez 200 tâches",
    icon: "💥",
    xp: 750,
  },

  // Journal
  journal_writer: {
    id: "journal_writer",
    title: "Écrivain du Journal",
    description: "Écrivez 10 entrées de journal",
    icon: "📝",
    xp: 100,
  },
  journal_master: {
    id: "journal_master",
    title: "Maître du Journal",
    description: "Écrivez 50 entrées de journal",
    icon: "📚",
    xp: 400,
  },

  // Special
  early_adopter: {
    id: "early_adopter",
    title: "Pionnier",
    description: "Utilisez toutes les fonctionnalités de l'app",
    icon: "🚀",
    xp: 300,
  },
  ai_friend: {
    id: "ai_friend",
    title: "Ami de l'IA",
    description: "Utilisez 50 crédits IA",
    icon: "🤖",
    xp: 150,
  },
  shopaholic: {
    id: "shopaholic",
    title: "Collectionneur",
    description: "Achetez 10 items dans la boutique",
    icon: "🛒",
    xp: 200,
  },
  rich_player: {
    id: "rich_player",
    title: "Riche Joueur",
    description: "Accumulez 1000 crédits",
    icon: "💰",
    xp: 300,
  },
};

export const useAchievements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!user,
  });

  const unlockAchievement = useMutation({
    mutationFn: async (achievementId: keyof typeof ACHIEVEMENT_DEFINITIONS) => {
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
        if (error.code === "23505") return null; // Already exists
        throw error;
      }

      return achievement;
    },
    onSuccess: (achievement) => {
      if (achievement) {
        queryClient.invalidateQueries({ queryKey: ["achievements", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["player-profile", user?.id] });
        toast({
          title: `${achievement.icon} Achievement Débloqué !`,
          description: `${achievement.title} - +${achievement.xp} XP`,
        });
      }
    },
  });

  const hasAchievement = (achievementId: string) => {
    return achievements?.some(a => a.achievement_id === achievementId) || false;
  };

  return {
    achievements: achievements || [],
    isLoading,
    unlockAchievement: unlockAchievement.mutate,
    isUnlocking: unlockAchievement.isPending,
    hasAchievement,
    totalAchievements: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
  };
};
