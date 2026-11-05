import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession, createCustomerPortal, type CheckoutPlan } from "@/services/billing";
import { getAIUsage } from "@/utils/aiLimits";

export type SubscriptionTier = "basic" | "premium" | "admin";
export interface SubscriptionLimits { dailyAIChats: number; dailyAnalyses: number; hasAIProfile: boolean; isUnlimited: boolean; }

// Compatibility adapter: every AI feature shares the server's finite ledger.
export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const usage = useQuery({
    queryKey: ["ai-usage", user?.id], enabled: Boolean(user),
    queryFn: async () => { const value = await getAIUsage(); if (!value) throw new Error("Le quota IA ne peut pas être vérifié."); return value; },
  });
  const isPremium = usage.data?.is_premium === true;
  const currentTier: SubscriptionTier = isPremium ? "premium" : "basic";
  const remaining = usage.isError ? 0 : usage.data?.remaining ?? 0;
  const limits: SubscriptionLimits = { dailyAIChats: usage.data?.daily_limit ?? 0, dailyAnalyses: usage.data?.daily_limit ?? 0, hasAIProfile: true, isUnlimited: false };
  const refreshUsage = async () => { await queryClient.invalidateQueries({ queryKey: ["ai-usage", user?.id] }); };
  const handleStripeCheckout = async (plan: CheckoutPlan) => {
    const result = await createCheckoutSession(plan);
    if (result.error || !result.url) { toast({ title: "Paiement indisponible", description: result.error ?? "Aucun lien de paiement reçu.", variant: "destructive" }); return; }
    window.location.assign(result.url);
  };
  const handleManageSubscription = async () => {
    const result = await createCustomerPortal();
    if (result.error || !result.url) { toast({ title: "Portail indisponible", description: result.error ?? "Aucun lien reçu.", variant: "destructive" }); return; }
    window.location.assign(result.url);
  };
  return {
    currentTier, limits, subscription: usage.data ?? null, dailyUsage: { ai_chat_count: usage.data?.used ?? 0, ai_analysis_count: usage.data?.used ?? 0 },
    isLoading: usage.isLoading, isPremium, isAdmin: false,
    canUseFeature: (_type: "chat" | "analysis" | "ai_profile") => Boolean(user) && remaining > 0,
    getRemainingUses: (_type: "chat" | "analysis") => remaining,
    trackUsage: async (_type: "chat" | "analysis") => refreshUsage(),
    resetDailyUsage: async () => { throw new Error("Les crédits sont renouvelés automatiquement par le serveur."); },
    handleStripeCheckout, handleManageSubscription,
  };
};
