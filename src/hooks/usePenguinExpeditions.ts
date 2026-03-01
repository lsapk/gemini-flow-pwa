import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Expedition {
  id: string;
  user_id: string;
  title: string;
  description: string;
  expedition_type: string;
  target_value: number;
  current_progress: number;
  reward_type: string;
  reward_amount: number;
  started_at: string;
  expires_at: string | null;
  completed: boolean;
  completed_at: string | null;
}

const EXPEDITION_TEMPLATES = [
  { title: "Plongée Profonde", description: "Complète 3 sessions de focus de +1h", target: 3, type: "weekly", reward_type: "golden_fish", reward_amount: 1 },
  { title: "Constructeur d'Habitudes", description: "Maintiens tes habitudes pendant 5 jours", target: 5, type: "weekly", reward_type: "salmon", reward_amount: 3 },
  { title: "Marathon de Tâches", description: "Complète 15 tâches cette semaine", target: 15, type: "weekly", reward_type: "salmon", reward_amount: 2 },
  { title: "Réflexion Glaciale", description: "Écris 3 entrées de journal", target: 3, type: "weekly", reward_type: "golden_fish", reward_amount: 1 },
  { title: "Aurore Boréale", description: "Accumule 5h de focus total", target: 300, type: "weekly", reward_type: "golden_fish", reward_amount: 2 },
];

export const usePenguinExpeditions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expeditions = [], isLoading } = useQuery({
    queryKey: ["penguin-expeditions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("penguin_expeditions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Expedition[];
    },
    enabled: !!user,
  });

  const generateExpeditions = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Pick 3 random templates
      const shuffled = [...EXPEDITION_TEMPLATES].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const toInsert = selected.map(t => ({
        user_id: user.id,
        title: t.title,
        description: t.description,
        expedition_type: t.type,
        target_value: t.target,
        reward_type: t.reward_type,
        reward_amount: t.reward_amount,
        expires_at: expiresAt.toISOString(),
      }));

      const { error } = await supabase.from("penguin_expeditions").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penguin-expeditions"] });
      toast({ title: "🧊 Nouvelles expéditions !", description: "3 nouvelles expéditions vous attendent." });
    },
  });

  const activeExpeditions = expeditions.filter(e => !e.completed);
  const completedExpeditions = expeditions.filter(e => e.completed);

  return {
    expeditions,
    activeExpeditions,
    completedExpeditions,
    isLoading,
    generateExpeditions: generateExpeditions.mutate,
    isGenerating: generateExpeditions.isPending,
  };
};
