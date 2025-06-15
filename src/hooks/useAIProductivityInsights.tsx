
import { useEffect, useState } from "react";
import { useAnalyticsData } from "./useAnalyticsData";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

// Typage minimal pour IA insight
export type AIInsight = {
  id: string;
  title: string;
  insight: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  category?: string;
  metric?: string;
};

export function useAIProductivityInsights() {
  const { user } = useAuth();
  const { 
    taskCompletionRate,
    totalFocusTime,
    streakCount,
    habitsData,
    focusData,
    activityData
  } = useAnalyticsData();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Générer la requête de contexte pour l’IA
    async function fetchAIInsights() {
      setIsLoading(true);
      try {
        // Prépare les données pour l’IA
        const userData = {
          taskCompletionRate,
          totalFocusTime,
          streakCount,
          habitsData,
          focusData,
          activityData
        };

        // Prompt IA : donner des conseils personnalisés et catégorisés
        const { data, error } = await supabase.functions.invoke("gemini-chat-enhanced", {
          body: {
            message: `Analyse ces données utilisateur et génère 5 à 8 conseils personnalisés pour améliorer sa productivité, ses habitudes ou son focus. Chaque conseil doit suivre cet objet JSON, en français uniquement:
[
  {
    "id": "unique_id",
    "title": "titre_concis_du_conseil",
    "insight": "phrase_d'analyse_personnalisée",
    "recommendation": "recommandation_actionnable_claire",
    "priority": "high|medium|low",
    "category": "performance|habits|focus|motivation|optimization",
    "metric": "valeur_ou_score_util"
  }
]
Uniquement la liste JSON, aucune explication extérieure.`,
            user_id: user.id,
            context: { user_data: userData, recent_messages: [] }
          }
        });

        // Vérifie la réponse de l’IA
        if (error) {
          setInsights([]);
          return;
        }

        let insightsList: AIInsight[] = [];
        if (data?.response) {
          // Extrait le bloc JSON uniquement
          const jsonMatch = data.response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            insightsList = JSON.parse(jsonMatch[0]);
          }
        }

        if (Array.isArray(insightsList) && insightsList.length > 0) {
          setInsights(insightsList);
        } else {
          setInsights([]);
        }
      } catch (err) {
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAIInsights();
    // eslint-disable-next-line
  }, [user, taskCompletionRate, totalFocusTime, streakCount, habitsData, focusData, activityData]);

  return { insights, isLoading };
}
