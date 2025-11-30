import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGenerateDailyQuests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateQuests = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = "https://xzgdfetnjnwrberyddmf.supabase.co";
      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-daily-quests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate quests");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      
      toast({
        title: "🎯 Quêtes Quotidiennes Générées !",
        description: `${data.quests_generated} nouvelles quêtes sont disponibles`,
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
    generateQuests: generateQuests.mutate,
    isGenerating: generateQuests.isPending,
  };
};