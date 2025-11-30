import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PowerUp {
  id: string;
  user_id: string;
  powerup_type: "focus_boost" | "xp_multiplier" | "productivity_shield";
  multiplier: number;
  expires_at: string;
  created_at: string;
}

export const POWERUP_DEFINITIONS = {
  focus_boost: {
    name: "Focus Boost",
    description: "Double le temps de focus pendant 1h",
    multiplier: 2.0,
    duration: 60, // minutes
    cost: 50,
    icon: "⚡",
    color: "from-yellow-500 to-orange-500",
  },
  xp_multiplier: {
    name: "XP Multiplier",
    description: "Triple l'XP gagné pendant 30min",
    multiplier: 3.0,
    duration: 30,
    cost: 75,
    icon: "🚀",
    color: "from-purple-500 to-pink-500",
  },
  productivity_shield: {
    name: "Productivity Shield",
    description: "Protection contre la perte de streak pendant 24h",
    multiplier: 1.0,
    duration: 1440,
    cost: 100,
    icon: "🛡️",
    color: "from-blue-500 to-cyan-500",
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
    refetchInterval: 30000, // Refresh every 30s
  });

  const activatePowerUp = useMutation({
    mutationFn: async (powerupType: keyof typeof POWERUP_DEFINITIONS) => {
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

      // Activate powerup
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + powerup.duration);

      const { error } = await supabase
        .from("active_powerups")
        .insert({
          user_id: user.id,
          powerup_type: powerupType,
          multiplier: powerup.multiplier,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      return powerupType;
    },
    onSuccess: (powerupType) => {
      queryClient.invalidateQueries({ queryKey: ["active-powerups"] });
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      
      const powerup = POWERUP_DEFINITIONS[powerupType];
      toast({
        title: `${powerup.icon} Power-Up Activé !`,
        description: powerup.description,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    activePowerUps: activePowerUps || [],
    isLoading,
    activatePowerUp: activatePowerUp.mutate,
    isActivating: activatePowerUp.isPending,
  };
};