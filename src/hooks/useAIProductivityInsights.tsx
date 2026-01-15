
import { useEffect, useState } from "react";
import { useAnalyticsData } from "./useAnalyticsData";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { aiRequestQueue } from "@/utils/aiRequestQueue";
import { toast } from "sonner";

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
    
    // Prevent multiple simultaneous calls
    let cancelled = false;
    
    // Load saved insights first
    const loadSavedInsights = async () => {
      if (cancelled) return true;
      
      const { data } = await supabase
        .from('ai_productivity_insights')
        .select('insights_data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.insights_data) {
        const savedInsights = data.insights_data as { insights: AIInsight[], generatedAt: string };
        const hoursSinceGeneration = (Date.now() - new Date(savedInsights.generatedAt).getTime()) / (1000 * 60 * 60);
        
        // Use cached insights if less than 6 hours old (instead of 24)
        // This ensures more frequent updates when user is active
        if (hoursSinceGeneration < 6) {
          setInsights(savedInsights.insights);
          return true;
        }
      }
      return false;
    };

    // Générer la requête de contexte pour l'IA
    async function fetchAIInsights() {
      if (cancelled) return;
      
      const hasCachedData = await loadSavedInsights();
      if (hasCachedData || cancelled) return;

      setIsLoading(true);
      try {
        // Prépare les données pour l'IA
        const userData = {
          taskCompletionRate,
          totalFocusTime,
          streakCount,
          habitsData,
          focusData,
          activityData
        };

        // Prompt IA : conseils courts et actionnables
        const { data, error } = await aiRequestQueue.add(() =>
          supabase.functions.invoke("gemini-chat-enhanced", {
            body: {
              message: `Analyse ces données et donne 3 conseils COURTS (max 15 mots chacun). Format JSON uniquement:
[{"id":"1","title":"Titre court","recommendation":"Action concrète","priority":"high|medium|low","category":"focus|habits|performance"}]

Données: Tâches ${taskCompletionRate}% | Focus ${totalFocusTime}min | Streak ${streakCount} | Habitudes actives ${habitsData?.length || 0}`,
              context: { user_data: userData, recent_messages: [] }
            }
          })
        );

        if (cancelled) return;

        // Handle errors gracefully
        if (error) {
          console.error('AI request error:', error);
          
          // Handle credits exhausted (402)
          if (error.message?.includes('402') || error.message?.includes('credits exhausted') || error.message?.includes('Payment Required')) {
            console.log('AI credits exhausted - keeping existing insights');
            toast.error('💳 Crédits IA épuisés. Ajoutez des crédits dans Settings → Cloud → Usage.');
            return;
          }
          
          // Keep existing insights if rate limited (429)
          if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
            console.log('Rate limited - keeping existing insights');
            toast.error('🚫 Limite d\'API atteinte. Réessayez plus tard.');
            return;
          }
          
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

        if (cancelled) return;

        if (Array.isArray(insightsList) && insightsList.length > 0) {
          setInsights(insightsList);
          
          // Save to database
          await supabase
            .from('ai_productivity_insights')
            .upsert({
              user_id: user.id,
              insights_data: {
                insights: insightsList,
                generatedAt: new Date().toISOString()
              }
            }, {
              onConflict: 'user_id'
            });
        } else {
          setInsights([]);
        }
      } catch (err) {
        if (!cancelled) {
          setInsights([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchAIInsights();
    
    return () => {
      cancelled = true;
    };
    // Only depend on user - analytics data is captured when the effect runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { insights, isLoading };
}
