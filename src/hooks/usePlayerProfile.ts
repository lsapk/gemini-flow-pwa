import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  const { isAdmin, user } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["player-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("player_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no profile exists, return null instead of throwing
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as PlayerProfile;
    },
    enabled: !!user, // Only run query if user is authenticated
    retry: 1,
  });

  const addXP = useMutation({
    mutationFn: async (xpAmount: number) => {
      if (!user || !profile) throw new Error("Not authenticated or no profile");

      const newXP = profile.experience_points + xpAmount;
      const { error } = await supabase
        .from("player_profiles")
        .update({ experience_points: newXP })
        .eq("user_id", user.id);

      if (error) throw error;
      return newXP;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile", user?.id] });
      toast({
        title: "⚡ XP Gagné !",
        description: "Vous progressez vers le niveau supérieur !",
      });
    },
  });

  const updateAvatar = useMutation({
    mutationFn: async (customization: Partial<PlayerProfile["avatar_customization"]>) => {
      if (!user || !profile) throw new Error("Not authenticated or no profile");

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
      queryClient.invalidateQueries({ queryKey: ["player-profile", user?.id] });
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

  // Admins get unlimited credits
  const effectiveProfile = profile && isAdmin 
    ? { ...profile, credits: Infinity }
    : profile;

  return {
    profile: effectiveProfile,
    isLoading,
    addXP: addXP.mutate,
    updateAvatar: updateAvatar.mutate,
    xpProgress,
    xpNeeded: profile ? calculateXPForLevel(profile.level) : 100,
    isAdmin,
  };
};