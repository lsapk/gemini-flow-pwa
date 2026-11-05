import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { requestAI } from "@/services/ai";
import { insightSchema, parseAIJson, type AIInsight } from "@/lib/ai-response";
export type { AIInsight } from "@/lib/ai-response";

export function useAIProductivityInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightOwner, setInsightOwner] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeUser = useRef(user?.id);
  activeUser.current = user?.id;
  const pending = useRef<string | null>(null);
  useEffect(() => {
    setInsights([]);
    setError(null);
    setIsLoading(false);
  }, [user?.id]);
  const generateInsights = async () => {
    if (!user || pending.current === user.id) return;
    pending.current = user.id;
    setIsLoading(true);
    setError(null);
    const owner = user.id;
    try {
      const response = await requestAI(
        'Analyse les tâches, habitudes, objectifs et séances de focus fournis. Donne 3 conseils courts basés uniquement sur des observations vérifiables. Si les données sont insuffisantes, dis-le clairement. Retourne uniquement un tableau JSON de 3 objets : {"id":"unique","title":"titre","insight":"observation factuelle","recommendation":"action possible","priority":"high|medium|low","category":"performance|habits|focus|motivation|optimization"}. Aucune prétention de diagnostic, de comparaison avec les autres utilisateurs ni de tendance non mesurée.',
      );
      const value = parseAIJson(response, insightSchema);
      if (activeUser.current === owner) {
        setInsights(value);
        setInsightOwner(owner);
      }
    } catch (failure) {
      if (activeUser.current === owner)
        setError(
          failure instanceof Error ? failure.message : "L’analyse a échoué.",
        );
    } finally {
      if (pending.current === owner) pending.current = null;
      if (activeUser.current === owner) setIsLoading(false);
    }
  };
  return {
    insights: insightOwner === user?.id ? insights : [],
    isLoading,
    error,
    generateInsights,
  };
}
