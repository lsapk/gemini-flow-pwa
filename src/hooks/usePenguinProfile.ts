import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PenguinProfile {
  id: string;
  user_id: string;
  stage: 'egg' | 'chick' | 'explorer' | 'emperor';
  shrimp_total: number;
  salmon_total: number;
  golden_fish_total: number;
  shrimp_today: number;
  shrimp_daily_limit: number;
  last_shrimp_reset: string;
  iceberg_size: number;
  climate_state: 'active' | 'rest';
  equipped_accessories: string[];
  has_radio: boolean;
  has_library: boolean;
  has_lounge_chair: boolean;
  created_at: string;
  updated_at: string;
}

const EVOLUTION_THRESHOLDS = {
  chick: { salmon: 5, shrimp: 20 },
  explorer: { salmon: 30, shrimp: 100 },
  emperor: { salmon: 100, shrimp: 300, golden_fish: 10 },
};

export const usePenguinProfile = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["penguin-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("penguin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as unknown as PenguinProfile;
    },
    enabled: !!user,
    retry: 1,
  });

  const checkEvolution = (p: PenguinProfile): PenguinProfile['stage'] | null => {
    if (p.stage === 'egg' && p.salmon_total >= EVOLUTION_THRESHOLDS.chick.salmon) return 'chick';
    if (p.stage === 'chick' && p.salmon_total >= EVOLUTION_THRESHOLDS.explorer.salmon) return 'explorer';
    if (p.stage === 'explorer' && p.salmon_total >= EVOLUTION_THRESHOLDS.emperor.salmon && p.golden_fish_total >= EVOLUTION_THRESHOLDS.emperor.golden_fish) return 'emperor';
    return null;
  };

  const nextStageProgress = profile ? (() => {
    const t = EVOLUTION_THRESHOLDS;
    switch (profile.stage) {
      case 'egg': return { current: profile.salmon_total, target: t.chick.salmon, label: 'Poussin' };
      case 'chick': return { current: profile.salmon_total, target: t.explorer.salmon, label: 'Explorateur' };
      case 'explorer': return { current: profile.salmon_total, target: t.emperor.salmon, label: 'Empereur' };
      case 'emperor': return { current: 1, target: 1, label: 'Maître' };
    }
  })() : null;

  const canEatShrimp = profile ? (
    profile.last_shrimp_reset !== new Date().toISOString().split('T')[0]
      ? true
      : profile.shrimp_today < profile.shrimp_daily_limit
  ) : false;

  return {
    profile,
    isLoading,
    isAdmin,
    checkEvolution,
    nextStageProgress,
    canEatShrimp,
    EVOLUTION_THRESHOLDS,
  };
};
