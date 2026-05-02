import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession, createCustomerPortal } from "@/services/billing";
import { toLocalDateKey } from "@/utils/dateUtils";

export type SubscriptionTier = "basic" | "premium" | "admin";

export interface SubscriptionLimits {
  dailyAIChats: number;
  dailyAnalyses: number;
  hasAIProfile: boolean;
  isUnlimited: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  basic: {
    dailyAIChats: 5,
    dailyAnalyses: 1,
    hasAIProfile: false,
    isUnlimited: false,
  },
  premium: {
    dailyAIChats: Infinity,
    dailyAnalyses: Infinity,
    hasAIProfile: true,
    isUnlimited: true,
  },
  admin: {
    dailyAIChats: Infinity,
    dailyAnalyses: Infinity,
    hasAIProfile: true,
    isUnlimited: true,
  },
};

export const useSubscription = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: dailyUsage, isLoading: usageLoading } = useQuery({
    queryKey: ["daily-usage", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = toLocalDateKey();
      const { data, error } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data || { ai_chat_count: 0, ai_analysis_count: 0 };
    },
    enabled: !!user,
  });

  const getCurrentTier = (): SubscriptionTier => {
    if (isAdmin) return "admin";
    if (subscription?.subscribed && subscription?.subscription_tier === "premium") {
      if (subscription.subscription_end) {
        const endDate = new Date(subscription.subscription_end);
        if (endDate > new Date()) return "premium";
      }
    }
    return "basic";
  };

  const currentTier = getCurrentTier();
  const limits = TIER_LIMITS[currentTier];

  const trackUsage = async (type: "chat" | "analysis") => {
    if (!user || limits.isUnlimited) return;
    // Atomic UPSERT on server (handles race conditions and timezone correctly)
    const { error } = await supabase.rpc("increment_daily_usage", { p_type: type });
    if (error) {
      console.error("increment_daily_usage failed", error);
    }
    queryClient.invalidateQueries({ queryKey: ["daily-usage", user?.id] });
  };

  const resetDailyUsage = async () => {
    if (!user) return;
    const { error } = await supabase.rpc("reset_my_daily_ai_usage");
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["daily-usage", user?.id] });
  };

  const canUseFeature = (type: "chat" | "analysis" | "ai_profile"): boolean => {
    if (limits.isUnlimited) return true;
    switch (type) {
      case "chat": return (dailyUsage?.ai_chat_count || 0) < limits.dailyAIChats;
      case "analysis": return (dailyUsage?.ai_analysis_count || 0) < limits.dailyAnalyses;
      case "ai_profile": return limits.hasAIProfile;
      default: return false;
    }
  };

  const getRemainingUses = (type: "chat" | "analysis"): number => {
    if (limits.isUnlimited) return Infinity;
    const used = type === "chat"
      ? (dailyUsage?.ai_chat_count || 0)
      : (dailyUsage?.ai_analysis_count || 0);
    const limit = type === "chat" ? limits.dailyAIChats : limits.dailyAnalyses;
    return Math.max(0, limit - used);
  };

  const handleStripeCheckout = async (plan: "premium_monthly" | "premium_yearly") => {
    try {
      const { url, error } = await createCheckoutSession(plan);
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le paiement Stripe",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url, error } = await createCustomerPortal();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail client",
        variant: "destructive",
      });
    }
  };

  return {
    currentTier,
    limits,
    subscription,
    dailyUsage,
    isLoading: subscriptionLoading || usageLoading,
    isPremium: currentTier === "premium" || currentTier === "admin",
    isAdmin: currentTier === "admin",
    canUseFeature,
    getRemainingUses,
    trackUsage,
    resetDailyUsage,
    handleStripeCheckout,
    handleManageSubscription,
  };
};
