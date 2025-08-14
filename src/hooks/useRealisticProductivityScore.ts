
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface RealisticProductivityData {
  score: number;
  level: string;
  badges: string[];
  taskEfficiency: number;
  habitConsistency: number;
  focusQuality: number;
  goalProgress: number;
  mentalWellbeing: number;
  insights: string[];
  recommendations: string[];
  weeklyTrend: number;
  strengths: string[];
  improvementAreas: string[];
  nextMilestone: string;
  detailedAnalysis: {
    taskManagement: {
      completionRate: number;
      averageTaskSize: string;
      procrastinationLevel: number;
      priorityBalance: string;
    };
    habitTracking: {
      streakAverage: number;
      consistencyScore: number;
      habitCategories: string[];
      adaptabilityScore: number;
    };
    focusPatterns: {
      averageSessionLength: number;
      qualityScore: number;
      distractionResistance: number;
      peakHours: string[];
    };
    emotionalState: {
      moodTrends: string;
      stressLevel: number;
      motivationLevel: number;
      selfReflectionDepth: number;
    };
  };
}

export const useRealisticProductivityScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['realistic-productivity-score', user?.id],
    queryFn: async (): Promise<RealisticProductivityData> => {
      if (!user) {
        return {
          score: 0,
          level: "Débutant",
          badges: [],
          taskEfficiency: 0,
          habitConsistency: 0,
          focusQuality: 0,
          goalProgress: 0,
          mentalWellbeing: 0,
          insights: [],
          recommendations: [],
          weeklyTrend: 0,
          strengths: [],
          improvementAreas: [],
          nextMilestone: "Commencez votre parcours de productivité",
          detailedAnalysis: {
            taskManagement: {
              completionRate: 0,
              averageTaskSize: "Inconnu",
              procrastinationLevel: 0,
              priorityBalance: "Non évalué"
            },
            habitTracking: {
              streakAverage: 0,
              consistencyScore: 0,
              habitCategories: [],
              adaptabilityScore: 0
            },
            focusPatterns: {
              averageSessionLength: 0,
              qualityScore: 0,
              distractionResistance: 0,
              peakHours: []
            },
            emotionalState: {
              moodTrends: "Non évalué",
              stressLevel: 0,
              motivationLevel: 0,
              selfReflectionDepth: 0
            }
          }
        };
      }

      try {
        // Collecte complète des données utilisateur
        const [
          tasksResult,
          habitsResult,
          goalsResult,
          journalResult,
          focusResult,
          completionsResult,
          reflectionsResult
        ] = await Promise.allSettled([
          supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
          supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('habit_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
          supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
        ]);

        const completeUserData = {
          tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
          habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
          goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
          journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
          focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
          habit_completions: completionsResult.status === 'fulfilled' ? (completionsResult.value.data || []) : [],
          daily_reflections: reflectionsResult.status === 'fulfilled' ? (reflectionsResult.value.data || []) : []
        };

        console.log("Données complètes collectées:", completeUserData);

        const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
          body: {
            message: `ANALYSE AVANCÉE DE PRODUCTIVITÉ - Créer un score réaliste et détaillé

Analyse ces données utilisateur complètes et calcule un score de productivité sophistiqué et réaliste.

DONNÉES À ANALYSER:
${JSON.stringify(completeUserData, null, 2)}

RETOURNE UNIQUEMENT un objet JSON avec cette structure exacte:
{
  "score": nombre_0_à_100_realiste,
  "level": "Débutant|Intermédiaire|Avancé|Expert|Maître",
  "badges": ["array_max_6_badges_français"],
  "taskEfficiency": nombre_0_à_100,
  "habitConsistency": nombre_0_à_100,
  "focusQuality": nombre_0_à_100,
  "goalProgress": nombre_0_à_100,
  "mentalWellbeing": nombre_0_à_100,
  "insights": ["array_max_5_insights_percutants"],
  "recommendations": ["array_max_5_conseils_actionables"],
  "weeklyTrend": nombre_-20_à_20_evolution,
  "strengths": ["array_max_3_forces"],
  "improvementAreas": ["array_max_3_axes_amelioration"],
  "nextMilestone": "string_objectif_suivant_realiste",
  "detailedAnalysis": {
    "taskManagement": {
      "completionRate": pourcentage_realiste,
      "averageTaskSize": "Petite|Moyenne|Grande",
      "procrastinationLevel": nombre_0_à_100,
      "priorityBalance": "Excellent|Bon|Moyen|Faible"
    },
    "habitTracking": {
      "streakAverage": nombre_jours_moyens,
      "consistencyScore": nombre_0_à_100,
      "habitCategories": ["array_categories_principales"],
      "adaptabilityScore": nombre_0_à_100
    },
    "focusPatterns": {
      "averageSessionLength": minutes_moyennes,
      "qualityScore": nombre_0_à_100,
      "distractionResistance": nombre_0_à_100,
      "peakHours": ["array_heures_pic"]
    },
    "emotionalState": {
      "moodTrends": "Positif|Neutre|Variable|Négatif",
      "stressLevel": nombre_0_à_100,
      "motivationLevel": nombre_0_à_100,
      "selfReflectionDepth": nombre_0_à_100
    }
  }
}

CRITÈRES D'ÉVALUATION RÉALISTES:
1. EFFICACITÉ DES TÂCHES (25%):
   - Taux de completion réel vs idéal
   - Temps entre création et completion
   - Complexité et priorité des tâches
   - Patterns de procrastination

2. CONSISTANCE DES HABITUDES (25%):
   - Régularité sur plusieurs semaines
   - Adaptation aux interruptions
   - Diversité et équilibre des habitudes
   - Évolution des streaks

3. QUALITÉ DU FOCUS (20%):
   - Durée vs qualité des sessions
   - Progression dans le temps
   - Résistance aux distractions
   - Patterns temporels

4. PROGRÈS VERS LES OBJECTIFS (15%):
   - Alignement tâches-objectifs
   - Réalisme des objectifs
   - Progression mesurable

5. BIEN-ÊTRE MENTAL (15%):
   - Patterns émotionnels (journal)
   - Profondeur des réflexions
   - Équilibre vie-productivité
   - Indicateurs de stress/burnout

BADGES RÉALISTES POSSIBLES:
- "🎯 Finisseur" (>80% completion)
- "🔥 Persévérant" (streaks >21j)
- "⚡ Efficace" (tasks rapides)
- "🧘 Zen" (bon équilibre)
- "📈 Progressif" (amélioration constante)
- "💡 Stratège" (bonnes priorités)
- "🎨 Créatif" (habitudes variées)
- "💪 Résilient" (récupération obstacles)
- "🌟 Équilibré" (tous domaines)
- "🚀 Momentum" (tendance positive)

SOIS RÉALISTE - Pas de scores parfaits sans données substantielles!`,
            user_id: user.id,
            context: {
              analysis_mode: true,
              realistic_scoring: true,
              user_data: completeUserData
            }
          }
        });

        if (error) throw error;

        // Parse de la réponse IA
        let parsedData: RealisticProductivityData;
        try {
          if (typeof data?.response === 'string') {
            const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
              parsedData = JSON.parse(data.response);
            }
          } else {
            parsedData = data?.response || data;
          }
        } catch (parseError) {
          console.error('Erreur parsing JSON productivité:', parseError);
          // Fallback réaliste basé sur les données
          const tasksCount = completeUserData.tasks.length;
          const completedTasks = completeUserData.tasks.filter(t => t.completed).length;
          const habitsCount = completeUserData.habits.length;
          const focusCount = completeUserData.focus_sessions.length;
          
          const baseScore = Math.min(85, Math.max(15, 
            (tasksCount > 0 ? (completedTasks / tasksCount) * 40 : 0) +
            (habitsCount > 0 ? Math.min(25, habitsCount * 5) : 0) +
            (focusCount > 0 ? Math.min(20, focusCount) : 0) +
            15 // Score de base
          ));

          parsedData = {
            score: Math.round(baseScore),
            level: baseScore >= 70 ? "Avancé" : baseScore >= 50 ? "Intermédiaire" : "Débutant",
            badges: tasksCount > 0 && completedTasks/tasksCount > 0.7 ? ["🎯 Finisseur"] : ["🌱 En développement"],
            taskEfficiency: tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0,
            habitConsistency: Math.min(100, habitsCount * 15),
            focusQuality: Math.min(100, focusCount * 2),
            goalProgress: completeUserData.goals.length > 0 ? 60 : 0,
            mentalWellbeing: completeUserData.journal_entries.length > 0 ? 65 : 50,
            insights: ["Analyse basée sur vos données actuelles", "Continuez à utiliser l'app pour des insights plus précis"],
            recommendations: ["Complétez plus de données pour une analyse détaillée", "Utilisez régulièrement toutes les fonctionnalités"],
            weeklyTrend: 0,
            strengths: tasksCount > 0 ? ["Gestion des tâches"] : ["Motivation"],
            improvementAreas: ["Consistance", "Données"],
            nextMilestone: "Utiliser l'app pendant 2 semaines complètes",
            detailedAnalysis: {
              taskManagement: {
                completionRate: tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0,
                averageTaskSize: "Moyenne",
                procrastinationLevel: 50,
                priorityBalance: "Moyen"
              },
              habitTracking: {
                streakAverage: 0,
                consistencyScore: Math.min(100, habitsCount * 15),
                habitCategories: [],
                adaptabilityScore: 50
              },
              focusPatterns: {
                averageSessionLength: 0,
                qualityScore: Math.min(100, focusCount * 2),
                distractionResistance: 50,
                peakHours: []
              },
              emotionalState: {
                moodTrends: "Non évalué",
                stressLevel: 50,
                motivationLevel: 60,
                selfReflectionDepth: completeUserData.daily_reflections.length > 0 ? 70 : 0
              }
            }
          };
        }

        // Validation et nettoyage des données
        return {
          score: Math.max(0, Math.min(100, parsedData.score || 0)),
          level: parsedData.level || 'Débutant',
          badges: Array.isArray(parsedData.badges) ? parsedData.badges.slice(0, 6) : [],
          taskEfficiency: Math.max(0, Math.min(100, parsedData.taskEfficiency || 0)),
          habitConsistency: Math.max(0, Math.min(100, parsedData.habitConsistency || 0)),
          focusQuality: Math.max(0, Math.min(100, parsedData.focusQuality || 0)),
          goalProgress: Math.max(0, Math.min(100, parsedData.goalProgress || 0)),
          mentalWellbeing: Math.max(0, Math.min(100, parsedData.mentalWellbeing || 0)),
          insights: Array.isArray(parsedData.insights) ? parsedData.insights.slice(0, 5) : [],
          recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations.slice(0, 5) : [],
          weeklyTrend: Math.max(-20, Math.min(20, parsedData.weeklyTrend || 0)),
          strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths.slice(0, 3) : [],
          improvementAreas: Array.isArray(parsedData.improvementAreas) ? parsedData.improvementAreas.slice(0, 3) : [],
          nextMilestone: parsedData.nextMilestone || "Continuez vos efforts",
          detailedAnalysis: parsedData.detailedAnalysis || {
            taskManagement: {
              completionRate: 0,
              averageTaskSize: "Inconnu",
              procrastinationLevel: 0,
              priorityBalance: "Non évalué"
            },
            habitTracking: {
              streakAverage: 0,
              consistencyScore: 0,
              habitCategories: [],
              adaptabilityScore: 0
            },
            focusPatterns: {
              averageSessionLength: 0,
              qualityScore: 0,
              distractionResistance: 0,
              peakHours: []
            },
            emotionalState: {
              moodTrends: "Non évalué",
              stressLevel: 0,
              motivationLevel: 0,
              selfReflectionDepth: 0
            }
          }
        };

      } catch (error) {
        console.error('Erreur calcul score productivité réaliste:', error);
        return {
          score: 20,
          level: "Débutant",
          badges: ["🌱 Nouveau départ"],
          taskEfficiency: 0,
          habitConsistency: 0,
          focusQuality: 0,
          goalProgress: 0,
          mentalWellbeing: 50,
          insights: ["Commencez par utiliser les fonctionnalités de base"],
          recommendations: ["Créez vos premières tâches et habitudes"],
          weeklyTrend: 0,
          strengths: ["Motivation à commencer"],
          improvementAreas: ["Utilisation régulière", "Collecte de données"],
          nextMilestone: "Utilisez l'app pendant une semaine",
          detailedAnalysis: {
            taskManagement: {
              completionRate: 0,
              averageTaskSize: "Inconnu",
              procrastinationLevel: 0,
              priorityBalance: "Non évalué"
            },
            habitTracking: {
              streakAverage: 0,
              consistencyScore: 0,
              habitCategories: [],
              adaptabilityScore: 0
            },
            focusPatterns: {
              averageSessionLength: 0,
              qualityScore: 0,
              distractionResistance: 0,
              peakHours: []
            },
            emotionalState: {
              moodTrends: "Non évalué",
              stressLevel: 0,
              motivationLevel: 0,
              selfReflectionDepth: 0
            }
          }
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
