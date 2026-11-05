import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAIUsage } from "@/utils/aiLimits";

// Legacy adapter. Credits can only be reserved/refunded inside an authenticated AI endpoint.
export const useAICredits = () => {
  const { user } = useAuth();
  const usage = useQuery({ queryKey: ["ai-usage", user?.id], enabled: Boolean(user), queryFn: async () => {
    const value = await getAIUsage();
    if (!value) throw new Error("Le quota IA ne peut pas être vérifié.");
    return value;
  }});
  const credits = usage.isError ? 0 : usage.data?.remaining ?? 0;
  const unavailable = async (_amount: number): Promise<never> => { throw new Error("Les crédits sont gérés exclusivement par les demandes IA côté serveur."); };
  return { credits, isLoading: usage.isLoading, error: usage.error, addCredits: unavailable, useCredits: unavailable,
    hasCredits: (amount: number) => Number.isSafeInteger(amount) && amount > 0 && credits >= amount, isAdmin: false };
};
