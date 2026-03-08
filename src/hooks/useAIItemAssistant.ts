import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskSuggestion {
  description: string;
  priority: "high" | "medium" | "low";
  due_date_suggestion?: string;
  subtasks: string[];
}

interface HabitSuggestion {
  description: string;
  frequency: string;
  category: string;
  tips: string;
}

interface GoalSuggestion {
  description: string;
  category: string;
  milestones: string[];
}

export type AISuggestion = TaskSuggestion | HabitSuggestion | GoalSuggestion;

interface SuggestParams {
  type: "task" | "habit" | "goal";
  title: string;
  existingData?: Record<string, unknown>;
}

export function useAIItemAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const suggest = async ({ type, title, existingData }: SuggestParams): Promise<AISuggestion | null> => {
    if (!title.trim()) {
      toast.error("Entrez d'abord un titre pour obtenir des suggestions IA.");
      return null;
    }

    setIsLoading(true);
    setSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-item-assistant", {
        body: { type, title: title.trim(), existingData },
      });

      if (error) throw error;

      if (data?.error === "AI_LIMIT_REACHED") {
        toast.error(data.message || "Limite IA quotidienne atteinte.");
        return null;
      }

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        toast.success("✨ Suggestions IA générées !");
        return data.suggestion;
      } else {
        toast.error("L'IA n'a pas pu générer de suggestions.");
        return null;
      }
    } catch (error: any) {
      console.error("AI suggestion error:", error);
      if (error?.message?.includes("429")) {
        toast.error("Trop de requêtes, réessayez dans un moment.");
      } else {
        toast.error("Erreur lors de la génération IA.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => setSuggestion(null);

  return { suggest, isLoading, suggestion, reset };
}
