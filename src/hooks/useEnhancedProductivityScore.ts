
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { aiRequestQueue } from "@/utils/aiRequestQueue";

interface EnhancedProductivityData {
  score: number;
  level: string;
  badges: string[];
  streakBonus: number;
  completionRate: number;
  focusTimeScore: number;
  consistencyScore: number;
  qualityScore: number;
  timeManagementScore: number;
  journalScore: number;
  goalScore: number;
  insights: string[];
  recommendations: string[];
  weeklyTrend: number;
  strongPoints: string[];
  improvementAreas: string[];
  nextMilestone: string;
}

export const useEnhancedProductivityScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enhanced-productivity-score', user?.id],
    queryFn: async (): Promise<EnhancedProductivityData> => {
      if (!user) {
        return {
          score: 0,
          level: "Débutant",
          badges: [],
          streakBonus: 0,
          completionRate: 0,
          focusTimeScore: 0,
          consistencyScore: 0,
          qualityScore: 0,
          timeManagementScore: 0,
          journalScore: 0,
          goalScore: 0,
          insights: [],
          recommendations: [],
          weeklyTrend: 0,
          strongPoints: [],
          improvementAreas: [],
          nextMilestone: "Commencez votre parcours de productivité"
        };
      }

      try {
        // Collect comprehensive user data
        const [
          tasksResult,
          habitsResult,
          goalsResult,
          journalResult,
          focusResult,
          completionsResult
        ] = await Promise.allSettled([
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
          supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('habit_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
        ]);

        const completeUserData = {
          tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
          habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
          goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
          journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
          focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
          habit_completions: completionsResult.status === 'fulfilled' ? (completionsResult.value.data || []) : []
        };

        const { data, error } = await aiRequestQueue.add(() =>
          supabase.functions.invoke('gemini-chat-enhanced', {
            body: {
              message: `Analyse approfondie et détaillée de productivité. Retourne UNIQUEMENT un objet JSON complet avec toutes ces propriétés:
              {
                "score": nombre_0_à_100,
                "level": "Débutant|Intermédiaire|Avancé|Expert|Maître",
                "badges": ["array_de_badges_français_pertinents_max_8"],
                "streakBonus": nombre_0_à_20,
                "completionRate": pourcentage_completion_tasks,
                "focusTimeScore": nombre_0_à_25,
                "consistencyScore": nombre_0_à_25,
                "qualityScore": nombre_0_à_25,
                "timeManagementScore": nombre_0_à_25,
                "journalScore": nombre_0_à_15,
                "goalScore": nombre_0_à_15,
                "insights": ["array_d_observations_perspicaces_max_5"],
                "recommendations": ["array_de_conseils_actionables_max_5"],
                "weeklyTrend": nombre_-100_à_100_evolution_semaine,
                "strongPoints": ["array_points_forts_max_3"],
                "improvementAreas": ["array_axes_amelioration_max_3"],
                "nextMilestone": "string_objectif_suivant"
              }
              
              ANALYSE APPROFONDIE REQUISE:
              - Calculer le score avec une méthode pondérée sophistiquée
              - Analyser les tendances temporelles et patterns
              - Identifier les forces et faiblesses spécifiques
              - Proposer des insights personnalisés et perspicaces
              - Donner des recommandations concrètes et réalisables
              - Calculer l'évolution sur la semaine passée
              - Identifier le prochain objectif logique à atteindre
              - Badges basés sur les vraies performances de l'utilisateur
              
              Données complètes: ${JSON.stringify(completeUserData)}`,
              user_id: user.id,
              context: {
                analysis_mode: true,
                user_data: completeUserData
              }
            }
          })
        );

        if (error) throw error;

        // Parse AI response with improved error handling
        let parsedData: EnhancedProductivityData;
        try {
          if (!data?.response) {
            throw new Error('Aucune réponse de l\'IA reçue');
          }

          if (typeof data.response === 'string') {
            // Remove any markdown formatting and extract JSON
            let jsonContent = data.response.trim();
            const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/) || jsonContent.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
              jsonContent = jsonMatch[1] || jsonMatch[0];
            }
            
            // Clean up any potential formatting issues
            jsonContent = jsonContent.replace(/^\s*```json\s*/, '').replace(/\s*```\s*$/, '').trim();
            
            if (!jsonContent || jsonContent === '') {
              throw new Error('Contenu JSON vide après nettoyage');
            }
            
            parsedData = JSON.parse(jsonContent);
          } else {
            parsedData = data.response;
          }
        } catch (parseError) {
          console.error('Error parsing enhanced productivity JSON:', parseError);
          // Fallback with enhanced default values
          parsedData = {
            score: 35,
            level: "Intermédiaire",
            badges: ["🎯 Premier Pas", "📝 Organisateur Débutant", "⏰ Gestionnaire du Temps"],
            streakBonus: 5,
            completionRate: 45,
            focusTimeScore: 8,
            consistencyScore: 12,
            qualityScore: 10,
            timeManagementScore: 15,
            journalScore: 3,
            goalScore: 7,
            insights: [
              "Vous montrez une bonne capacité d'organisation de base",
              "Votre régularité dans les habitudes est en développement",
              "Vous avez un potentiel d'amélioration important"
            ],
            recommendations: [
              "Définissez 2-3 objectifs prioritaires pour cette semaine",
              "Essayez la technique Pomodoro pour améliorer votre focus",
              "Tenez un journal quotidien de 5 minutes pour mieux vous connaître"
            ],
            weeklyTrend: 12,
            strongPoints: ["Organisation", "Motivation"],
            improvementAreas: ["Consistance", "Focus prolongé"],
            nextMilestone: "Atteindre 70% de completion des tâches cette semaine"
          };
        }

        // Validate and sanitize data
        return {
          score: Math.max(0, Math.min(100, parsedData.score || 0)),
          level: parsedData.level || 'Débutant',
          badges: Array.isArray(parsedData.badges) ? parsedData.badges.slice(0, 8) : [],
          streakBonus: Math.max(0, Math.min(20, parsedData.streakBonus || 0)),
          completionRate: Math.max(0, Math.min(100, parsedData.completionRate || 0)),
          focusTimeScore: Math.max(0, Math.min(25, parsedData.focusTimeScore || 0)),
          consistencyScore: Math.max(0, Math.min(25, parsedData.consistencyScore || 0)),
          qualityScore: Math.max(0, Math.min(25, parsedData.qualityScore || 0)),
          timeManagementScore: Math.max(0, Math.min(25, parsedData.timeManagementScore || 0)),
          journalScore: Math.max(0, Math.min(15, parsedData.journalScore || 0)),
          goalScore: Math.max(0, Math.min(15, parsedData.goalScore || 0)),
          insights: Array.isArray(parsedData.insights) ? parsedData.insights.slice(0, 5) : [],
          recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations.slice(0, 5) : [],
          weeklyTrend: Math.max(-100, Math.min(100, parsedData.weeklyTrend || 0)),
          strongPoints: Array.isArray(parsedData.strongPoints) ? parsedData.strongPoints.slice(0, 3) : [],
          improvementAreas: Array.isArray(parsedData.improvementAreas) ? parsedData.improvementAreas.slice(0, 3) : [],
          nextMilestone: parsedData.nextMilestone || "Continuez vos efforts pour progresser"
        };

      } catch (error) {
        console.error('Error calculating enhanced productivity score:', error);
        return {
          score: 0,
          level: "Débutant",
          badges: ["🌟 Nouveau Départ"],
          streakBonus: 0,
          completionRate: 0,
          focusTimeScore: 0,
          consistencyScore: 0,
          qualityScore: 0,
          timeManagementScore: 0,
          journalScore: 0,
          goalScore: 0,
          insights: ["Commencez par créer vos premières tâches et habitudes"],
          recommendations: ["Explorez DeepFlow pour améliorer votre productivité"],
          weeklyTrend: 0,
          strongPoints: [],
          improvementAreas: ["Démarrage", "Organisation"],
          nextMilestone: "Créer votre première tâche et la compléter"
        };
      }
    },
    enabled: !!user,
    staleTime: 60 * 60 * 1000, // 1 hour - increased to reduce API calls
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: false, // Disable automatic retries to prevent rate limiting
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};
