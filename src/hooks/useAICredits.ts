import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface AICredits {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  last_updated: string;
}

export const useAICredits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: aiCredits, isLoading } = useQuery({
    queryKey: ["ai-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ai_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AICredits | null;
    },
  });

  const addCredits = useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentCredits = aiCredits?.credits || 0;
      const newCredits = currentCredits + amount;

      if (aiCredits) {
        const { error } = await supabase
          .from("ai_credits")
          .update({ credits: newCredits, last_updated: new Date().toISOString() })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_credits")
          .insert({ user_id: user.id, credits: newCredits });
        if (error) throw error;
      }

      return newCredits;
    },
    onSuccess: (newCredits) => {
      queryClient.invalidateQueries({ queryKey: ["ai-credits"] });
      toast({
        title: "🤖 Crédits IA Ajoutés !",
        description: `Vous avez maintenant ${newCredits} crédits IA`,
      });
    },
  });

  const useCredits = useMutation({
    mutationFn: async (amount: number) => {
      // Admins have unlimited credits - skip the check
      if (isAdmin) {
        return Infinity;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentCredits = aiCredits?.credits || 0;
      if (currentCredits < amount) {
        throw new Error("Pas assez de crédits IA");
      }

      const newCredits = currentCredits - amount;
      const { error } = await supabase
        .from("ai_credits")
        .update({ credits: newCredits, last_updated: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;
      return newCredits;
    },
    onSuccess: () => {
      if (!isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["ai-credits"] });
      }
    },
  });

  // Admins get unlimited credits displayed as Infinity
  const effectiveCredits = isAdmin ? Infinity : (aiCredits?.credits || 0);

  return {
    credits: effectiveCredits,
    isLoading,
    addCredits: addCredits.mutate,
    useCredits: useCredits.mutate,
    hasCredits: (amount: number) => isAdmin || (aiCredits?.credits || 0) >= amount,
    isAdmin,
  };
};
