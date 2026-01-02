import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionTier = "basic" | "premium" | "admin";

export interface SubscriptionLimits {
  dailyAIChats: number;
  dailyAnalyses: number;
  hasAIProfile: boolean;
  hasFullGamification: boolean;
  isUnlimited: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  basic: {
    dailyAIChats: 5,
    dailyAnalyses: 1,
    hasAIProfile: false,
    hasFullGamification: false,
    isUnlimited: false,
  },
  premium: {
    dailyAIChats: Infinity,
    dailyAnalyses: Infinity,
    hasAIProfile: true,
    hasFullGamification: true,
    isUnlimited: true,
  },
  admin: {
    dailyAIChats: Infinity,
    dailyAnalyses: Infinity,
    hasAIProfile: true,
    hasFullGamification: true,
    isUnlimited: true,
  },
};

export const useSubscription = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subscription status
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

  // Get today's usage
  const { data: dailyUsage, isLoading: usageLoading } = useQuery({
    queryKey: ["daily-usage", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date().toISOString().split("T")[0];
      
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

  // Determine current tier
  const getCurrentTier = (): SubscriptionTier => {
    if (isAdmin) return "admin";
    if (subscription?.subscribed && subscription?.subscription_tier === "premium") {
      // Check if subscription is still valid
      if (subscription.subscription_end) {
        const endDate = new Date(subscription.subscription_end);
        if (endDate > new Date()) {
          return "premium";
        }
      }
    }
    return "basic";
  };

  const currentTier = getCurrentTier();
  const limits = TIER_LIMITS[currentTier];

  // Track AI usage
  const trackUsage = useMutation({
    mutationFn: async (type: "chat" | "analysis") => {
      if (!user || limits.isUnlimited) return;

      const today = new Date().toISOString().split("T")[0];
      
      // First try to get existing record
      const { data: existing } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const updateData = type === "chat" 
          ? { ai_chat_count: existing.ai_chat_count + 1 }
          : { ai_analysis_count: existing.ai_analysis_count + 1 };

        await supabase
          .from("daily_usage")
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        // Insert new record
        const insertData = {
          user_id: user.id,
          usage_date: today,
          ai_chat_count: type === "chat" ? 1 : 0,
          ai_analysis_count: type === "analysis" ? 1 : 0,
        };

        await supabase.from("daily_usage").insert(insertData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-usage", user?.id] });
    },
  });

  // Check if user can use a feature
  const canUseFeature = (type: "chat" | "analysis" | "ai_profile" | "gamification"): boolean => {
    if (limits.isUnlimited) return true;

    switch (type) {
      case "chat":
        return (dailyUsage?.ai_chat_count || 0) < limits.dailyAIChats;
      case "analysis":
        return (dailyUsage?.ai_analysis_count || 0) < limits.dailyAnalyses;
      case "ai_profile":
        return limits.hasAIProfile;
      case "gamification":
        return limits.hasFullGamification;
      default:
        return false;
    }
  };

  // Get remaining uses
  const getRemainingUses = (type: "chat" | "analysis"): number => {
    if (limits.isUnlimited) return Infinity;
    
    const used = type === "chat" 
      ? (dailyUsage?.ai_chat_count || 0)
      : (dailyUsage?.ai_analysis_count || 0);
    
    const limit = type === "chat" ? limits.dailyAIChats : limits.dailyAnalyses;
    
    return Math.max(0, limit - used);
  };

  // Create PayPal order
  const createPayPalOrder = useMutation({
    mutationFn: async (plan: string) => {
      const { data, error } = await supabase.functions.invoke("paypal-create-order", {
        body: { plan },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande PayPal",
        variant: "destructive",
      });
    },
  });

  // Capture PayPal order
  const capturePayPalOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke("paypal-capture-order", {
        body: { orderId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
      toast({
        title: "🎉 Bienvenue dans Premium !",
        description: "Votre abonnement est maintenant actif",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de finaliser le paiement",
        variant: "destructive",
      });
    },
  });

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
    trackUsage: trackUsage.mutate,
    createPayPalOrder: createPayPalOrder.mutateAsync,
    capturePayPalOrder: capturePayPalOrder.mutateAsync,
    isCreatingOrder: createPayPalOrder.isPending,
    isCapturingOrder: capturePayPalOrder.isPending,
  };
};
