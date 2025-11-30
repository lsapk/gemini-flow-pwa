import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlayerProfile {
  id: string;
  user_id: string;
  experience_points: number;
  level: number;
  avatar_type: string;
  avatar_customization: {
    helmet: string;
    armor: string;
    glow_color: string;
  };
  total_quests_completed: number;
  credits: number;
  created_at: string;
  updated_at: string;
}

export const usePlayerProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["player-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("player_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as PlayerProfile;
    },
  });

  const addXP = useMutation({
    mutationFn: async (xpAmount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) throw new Error("Not authenticated");

      const newXP = profile.experience_points + xpAmount;
      const { error } = await supabase
        .from("player_profiles")
        .update({ experience_points: newXP })
        .eq("user_id", user.id);

      if (error) throw error;
      return newXP;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      toast({
        title: "⚡ XP Gagné !",
        description: "Vous progressez vers le niveau supérieur !",
      });
    },
  });

  const updateAvatar = useMutation({
    mutationFn: async (customization: Partial<PlayerProfile["avatar_customization"]>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) throw new Error("Not authenticated");

      const newCustomization = {
        ...profile.avatar_customization,
        ...customization,
      };

      const { error } = await supabase
        .from("player_profiles")
        .update({ avatar_customization: newCustomization })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      toast({
        title: "🎨 Avatar Mis à Jour",
        description: "Votre personnage a été personnalisé !",
      });
    },
  });

  const calculateXPForLevel = (level: number) => {
    return 100 * level * level;
  };

  const xpProgress = profile
    ? (profile.experience_points / calculateXPForLevel(profile.level)) * 100
    : 0;

  return {
    profile,
    isLoading,
    addXP: addXP.mutate,
    updateAvatar: updateAvatar.mutate,
    xpProgress,
    xpNeeded: profile ? calculateXPForLevel(profile.level) : 100,
  };
};