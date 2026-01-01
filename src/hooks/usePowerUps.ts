import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  | "ai_credits_mega"
  | "xp_boost_2x"
  | "xp_boost_3x"
  | "streak_shield"
  | "streak_mega_shield"
  | "mystery_box"
  | "legendary_box"
  | "cyber_visor"
  | "neon_crown"
  | "energy_armor";

export const POWERUP_DEFINITIONS: Record<PowerUpType, {
  name: string;
  description: string;
  reward: string;
  rewardType: "ai_credits" | "xp_boost" | "protection" | "random" | "cosmetic";
  rewardValue: number | string;
  duration: number;
  cost: number;
  icon: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}> = {
  ai_credits_bonus: {
    name: "Pack IA Basic",
    description: "Recevez 25 crédits IA pour l'assistant",
    reward: "+25 crédits IA",
    rewardType: "ai_credits",
    rewardValue: 25,
    duration: 0,
    cost: 50,
    icon: "🤖",
    color: "from-blue-500 to-cyan-500",
    rarity: "common",
  },
  ai_credits_mega: {
    name: "Pack IA Mega",
    description: "Recevez 100 crédits IA pour l'assistant",
    reward: "+100 crédits IA",
    rewardType: "ai_credits",
    rewardValue: 100,
    duration: 0,
    cost: 150,
    icon: "🧠",
    color: "from-indigo-500 to-purple-500",
    rarity: "rare",
  },
  xp_boost_2x: {
    name: "XP Boost x2",
    description: "Doublez vos gains d'XP pendant 24h",
    reward: "XP x2 pendant 24h",
    rewardType: "xp_boost",
    rewardValue: 2,
    duration: 1440,
    cost: 100,
    icon: "⚡",
    color: "from-yellow-500 to-orange-500",
    rarity: "rare",
  },
  xp_boost_3x: {
    name: "XP Boost x3",
    description: "Triplez vos gains d'XP pendant 24h",
    reward: "XP x3 pendant 24h",
    rewardType: "xp_boost",
    rewardValue: 3,
    duration: 1440,
    cost: 200,
    icon: "🔥",
    color: "from-orange-500 to-red-500",
    rarity: "epic",
  },
  streak_shield: {
    name: "Bouclier de Streak",
    description: "Protège votre streak pendant 3 jours",
    reward: "Protection 3 jours",
    rewardType: "protection",
    rewardValue: 3,
    duration: 4320,
    cost: 75,
    icon: "🛡️",
    color: "from-green-500 to-emerald-500",
    rarity: "common",
  },
  streak_mega_shield: {
    name: "Méga Bouclier",
    description: "Protège votre streak pendant 7 jours",
    reward: "Protection 7 jours",
    rewardType: "protection",
    rewardValue: 7,
    duration: 10080,
    cost: 150,
    icon: "🔰",
    color: "from-teal-500 to-cyan-500",
    rarity: "rare",
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
    color: "from-pink-500 to-purple-500",
    rarity: "common",
  },
  legendary_box: {
    name: "Coffre Légendaire",
    description: "Récompenses rares garanties !",
    reward: "Récompense Légendaire",
    rewardType: "random",
    rewardValue: 1,
    duration: 0,
    cost: 250,
    icon: "👑",
    color: "from-amber-500 to-yellow-300",
    rarity: "legendary",
  },
  cyber_visor: {
    name: "Visière Cyber",
    description: "Débloquez l'accessoire Visière Cyber",
    reward: "Accessoire: Visière",
    rewardType: "cosmetic",
    rewardValue: "helmet_visor",
    duration: 0,
    cost: 120,
    icon: "🥽",
    color: "from-cyan-500 to-blue-500",
    rarity: "rare",
  },
  neon_crown: {
    name: "Couronne Néon",
    description: "Débloquez l'accessoire Couronne Néon",
    reward: "Accessoire: Couronne",
    rewardType: "cosmetic",
    rewardValue: "helmet_crown",
    duration: 0,
    cost: 180,
    icon: "👑",
    color: "from-purple-500 to-pink-500",
    rarity: "epic",
  },
  energy_armor: {
    name: "Armure Énergie",
    description: "Débloquez l'armure Énergie",
    reward: "Accessoire: Armure",
    rewardType: "cosmetic",
    rewardValue: "armor_energy",
    duration: 0,
    cost: 200,
    icon: "⚡",
    color: "from-blue-500 to-purple-500",
    rarity: "epic",
  },
};

export const usePowerUps = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: activePowerUps, isLoading } = useQuery({
    queryKey: ["active-powerups", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("active_powerups")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;
      return data as PowerUp[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: unlockedItems } = useQuery({
    queryKey: ["unlocked-items", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("unlockables")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activatePowerUp = useMutation({
    mutationFn: async (powerupType: PowerUpType) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const powerup = POWERUP_DEFINITIONS[powerupType];
      
      // Check if user has enough credits
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("credits, experience_points")
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

        case "xp_boost":
          const expiresAtBoost = new Date();
          expiresAtBoost.setMinutes(expiresAtBoost.getMinutes() + powerup.duration);

          await supabase
            .from("active_powerups")
            .insert({
              user_id: user.id,
              powerup_type: powerupType,
              multiplier: powerup.rewardValue as number,
              expires_at: expiresAtBoost.toISOString(),
            });
          break;

        case "cosmetic":
          // Check if already unlocked
          const { data: existing } = await supabase
            .from("unlockables")
            .select("id")
            .eq("user_id", user.id)
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
              unlockable_type: (powerup.rewardValue as string).startsWith("helmet") ? "helmet" : "armor",
              unlockable_id: powerup.rewardValue as string,
            });
          break;

        case "protection":
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
          // Mystery/Legendary box - random reward
          const isLegendary = powerupType === "legendary_box";
          const rewards = isLegendary ? [
            { type: "xp", value: 500, message: "+500 XP 🎉" },
            { type: "credits", value: 200, message: "+200 crédits 💰" },
            { type: "ai_credits", value: 50, message: "+50 crédits IA 🧠" },
            { type: "xp", value: 750, message: "+750 XP 🔥" },
          ] : [
            { type: "xp", value: 50, message: "+50 XP" },
            { type: "xp", value: 100, message: "+100 XP" },
            { type: "credits", value: 25, message: "+25 crédits" },
            { type: "credits", value: 50, message: "+50 crédits" },
            { type: "ai_credits", value: 10, message: "+10 crédits IA" },
            { type: "ai_credits", value: 5, message: "+5 crédits IA" },
          ];
          const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
          
          if (randomReward.type === "xp") {
            await supabase
              .from("player_profiles")
              .update({ experience_points: profile.experience_points + randomReward.value })
              .eq("user_id", user.id);
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
          title: "🎁 Coffre Ouvert !",
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
    return activePowerUps?.some(p => 
      p.powerup_type === "streak_shield" || p.powerup_type === "streak_mega_shield"
    ) || false;
  };

  const getActiveXPMultiplier = () => {
    const boost = activePowerUps?.find(p => 
      p.powerup_type === "xp_boost_2x" || p.powerup_type === "xp_boost_3x"
    );
    return boost?.multiplier || 1;
  };

  return {
    activePowerUps: activePowerUps || [],
    unlockedItems: unlockedItems || [],
    isLoading,
    activatePowerUp: activatePowerUp.mutate,
    isActivating: activatePowerUp.isPending,
    isItemUnlocked,
    hasActiveProtection,
    getActiveXPMultiplier,
  };
};
