import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PowerUp {
  id: string;
  user_id: string;
  powerup_type: string;
  multiplier: number;
  expires_at: string;
  created_at: string;
}

export type PowerUpType = 
  | "ai_credits_bonus"
  | "dark_theme_unlock"
  | "neon_theme_unlock"
  | "cyber_avatar_unlock"
  | "streak_shield"
  | "mystery_box";

export const POWERUP_DEFINITIONS: Record<PowerUpType, {
  name: string;
  description: string;
  reward: string;
  rewardType: "ai_credits" | "theme" | "avatar" | "protection" | "random";
  rewardValue: number | string;
  duration: number;
  cost: number;
  icon: string;
  color: string;
}> = {
  ai_credits_bonus: {
    name: "Crédits IA",
    description: "Recevez 25 crédits IA pour l'assistant",
    reward: "+25 crédits IA",
    rewardType: "ai_credits",
    rewardValue: 25,
    duration: 0, // Permanent
    cost: 50,
    icon: "🤖",
    color: "from-blue-500 to-cyan-500",
  },
  dark_theme_unlock: {
    name: "Thème Obsidian",
    description: "Débloquez le thème sombre Obsidian",
    reward: "Thème Obsidian",
    rewardType: "theme",
    rewardValue: "obsidian",
    duration: 0,
    cost: 100,
    icon: "🌙",
    color: "from-slate-600 to-slate-800",
  },
  neon_theme_unlock: {
    name: "Thème Neon",
    description: "Débloquez le thème cyberpunk Neon",
    reward: "Thème Neon",
    rewardType: "theme",
    rewardValue: "neon",
    duration: 0,
    cost: 150,
    icon: "💜",
    color: "from-purple-500 to-pink-500",
  },
  cyber_avatar_unlock: {
    name: "Avatar Cyber Elite",
    description: "Débloquez l'avatar Cyber Elite premium",
    reward: "Avatar Cyber Elite",
    rewardType: "avatar",
    rewardValue: "cyber_elite",
    duration: 0,
    cost: 200,
    icon: "🦾",
    color: "from-amber-500 to-orange-500",
  },
  streak_shield: {
    name: "Bouclier de Streak",
    description: "Protège votre streak pendant 7 jours",
    reward: "Protection 7 jours",
    rewardType: "protection",
    rewardValue: 7,
    duration: 10080, // 7 days in minutes
    cost: 75,
    icon: "🛡️",
    color: "from-green-500 to-emerald-500",
  },
  mystery_box: {
    name: "Boîte Mystère",
    description: "Contient une récompense aléatoire !",
    reward: "???",
    rewardType: "random",
    rewardValue: 0,
    duration: 0,
    cost: 30,
    icon: "🎁",
    color: "from-yellow-500 to-red-500",
  },
};

export const usePowerUps = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activePowerUps, isLoading } = useQuery({
    queryKey: ["active-powerups"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("active_powerups")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;
      return data as PowerUp[];
    },
    refetchInterval: 30000,
  });

  const { data: unlockedItems } = useQuery({
    queryKey: ["unlocked-items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("unlockables")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  const activatePowerUp = useMutation({
    mutationFn: async (powerupType: PowerUpType) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const powerup = POWERUP_DEFINITIONS[powerupType];
      
      // Check if user has enough credits
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.credits < powerup.cost) {
        throw new Error("Pas assez de crédits");
      }

      // Deduct credits
      await supabase
        .from("player_profiles")
        .update({ credits: profile.credits - powerup.cost })
        .eq("user_id", user.id);

      // Handle different reward types
      switch (powerup.rewardType) {
        case "ai_credits":
          // Add AI credits
          const { data: aiCredits } = await supabase
            .from("ai_credits")
            .select("credits")
            .eq("user_id", user.id)
            .maybeSingle();

          if (aiCredits) {
            await supabase
              .from("ai_credits")
              .update({ credits: aiCredits.credits + (powerup.rewardValue as number) })
              .eq("user_id", user.id);
          } else {
            await supabase
              .from("ai_credits")
              .insert({ user_id: user.id, credits: powerup.rewardValue as number });
          }
          break;

        case "theme":
        case "avatar":
          // Check if already unlocked
          const { data: existing } = await supabase
            .from("unlockables")
            .select("id")
            .eq("user_id", user.id)
            .eq("unlockable_type", powerup.rewardType)
            .eq("unlockable_id", powerup.rewardValue as string)
            .maybeSingle();

          if (existing) {
            // Refund credits
            await supabase
              .from("player_profiles")
              .update({ credits: profile.credits })
              .eq("user_id", user.id);
            throw new Error("Déjà débloqué !");
          }

          await supabase
            .from("unlockables")
            .insert({
              user_id: user.id,
              unlockable_type: powerup.rewardType,
              unlockable_id: powerup.rewardValue as string,
            });
          break;

        case "protection":
          // Add temporary protection
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + powerup.duration);

          await supabase
            .from("active_powerups")
            .insert({
              user_id: user.id,
              powerup_type: powerupType,
              multiplier: 1,
              expires_at: expiresAt.toISOString(),
            });
          break;

        case "random":
          // Mystery box - random reward
          const rewards = [
            { type: "xp", value: 100, message: "+100 XP" },
            { type: "credits", value: 50, message: "+50 crédits" },
            { type: "ai_credits", value: 10, message: "+10 crédits IA" },
          ];
          const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
          
          if (randomReward.type === "xp") {
            const { data: xpProfile } = await supabase
              .from("player_profiles")
              .select("experience_points")
              .eq("user_id", user.id)
              .single();
            if (xpProfile) {
              await supabase
                .from("player_profiles")
                .update({ experience_points: xpProfile.experience_points + randomReward.value })
                .eq("user_id", user.id);
            }
          } else if (randomReward.type === "credits") {
            await supabase
              .from("player_profiles")
              .update({ credits: profile.credits - powerup.cost + randomReward.value })
              .eq("user_id", user.id);
          } else if (randomReward.type === "ai_credits") {
            const { data: aiCreds } = await supabase
              .from("ai_credits")
              .select("credits")
              .eq("user_id", user.id)
              .maybeSingle();
            if (aiCreds) {
              await supabase
                .from("ai_credits")
                .update({ credits: aiCreds.credits + randomReward.value })
                .eq("user_id", user.id);
            }
          }
          return { ...powerup, randomReward };
      }

      return powerup;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["active-powerups"] });
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      queryClient.invalidateQueries({ queryKey: ["unlocked-items"] });
      queryClient.invalidateQueries({ queryKey: ["ai-credits"] });
      
      if ('randomReward' in result && result.randomReward) {
        toast({
          title: "🎁 Boîte Mystère Ouverte !",
          description: `Vous avez gagné : ${result.randomReward.message}`,
        });
      } else {
        toast({
          title: `${result.icon} Récompense Débloquée !`,
          description: result.reward,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isItemUnlocked = (type: string, id: string) => {
    return unlockedItems?.some(item => 
      item.unlockable_type === type && item.unlockable_id === id
    ) || false;
  };

  const hasActiveProtection = () => {
    return activePowerUps?.some(p => p.powerup_type === "streak_shield") || false;
  };

  return {
    activePowerUps: activePowerUps || [],
    unlockedItems: unlockedItems || [],
    isLoading,
    activatePowerUp: activatePowerUp.mutate,
    isActivating: activatePowerUp.isPending,
    isItemUnlocked,
    hasActiveProtection,
  };
};
