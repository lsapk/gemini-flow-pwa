import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProductivityAnalysis {
  score: number;
  completionRate: number;
  focusTimeScore: number;
  consistencyScore: number;
  qualityScore: number;
  timeManagementScore: number;
  journalScore: number;
  goalScore: number;
  insights: string[];
  recommendations: string[];
  detailedBreakdown: {
    tasksCompleted: number;
    totalTasks: number;
    habitsCompleted: number;
    totalHabits: number;
    focusTimeMinutes: number;
    journalEntries: number;
    goalsAchieved: number;
    totalGoals: number;
  };
}

export const useRealProductivityAnalysis = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['real-productivity-analysis', user?.id],
    queryFn: async (): Promise<ProductivityAnalysis> => {
      if (!user) {
        return {
          score: 0,
          completionRate: 0,
          focusTimeScore: 0,
          consistencyScore: 0,
          qualityScore: 0,
          timeManagementScore: 0,
          journalScore: 0,
          goalScore: 0,
          insights: [],
          recommendations: [],
          detailedBreakdown: {
            tasksCompleted: 0,
            totalTasks: 0,
            habitsCompleted: 0,
            totalHabits: 0,
            focusTimeMinutes: 0,
            journalEntries: 0,
            goalsAchieved: 0,
            totalGoals: 0
          }
        };
      }

      try {
        // Fetch all user data for analysis
        const [
          tasksResult,
          habitsResult,
          goalsResult,
          journalResult,
          focusResult,
          habitCompletionsResult
        ] = await Promise.allSettled([
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
          supabase.from('focus_sessions').select('*').eq('user_id', user.id),
          supabase.from('habit_completions').select('*').eq('user_id', user.id).gte('completed_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        ]);

        const userData = {
          tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
          habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
          goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
          journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
          focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
          habit_completions: habitCompletionsResult.status === 'fulfilled' ? (habitCompletionsResult.value.data || []) : []
        };

        // Call AI for comprehensive analysis
        const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
          body: {
            message: `Analyse détaillée de productivité avec calculs précis. 

DONNÉES UTILISATEUR:
- Tâches: ${userData.tasks.length} (complétées: ${userData.tasks.filter(t => t.completed).length})
- Habitudes: ${userData.habits.length} 
- Objectifs: ${userData.goals.length} (complétés: ${userData.goals.filter(g => g.completed).length})
- Sessions focus: ${userData.focus_sessions.length} (total minutes: ${userData.focus_sessions.reduce((acc, f) => acc + (f.duration || 0), 0)})
- Entrées journal: ${userData.journal_entries.length}
- Complétions habitudes cette semaine: ${userData.habit_completions.length}

MISSION: Analyser et retourner UNIQUEMENT un objet JSON avec cette structure exacte:

{
  "score": [score_global_0_à_100_calculé_précisément],
  "completionRate": [pourcentage_tâches_complétées],
  "focusTimeScore": [score_focus_0_à_25_basé_sur_minutes_réelles],
  "consistencyScore": [score_régularité_0_à_25_basé_habitudes],
  "qualityScore": [score_qualité_0_à_25_basé_objectifs],
  "timeManagementScore": [score_gestion_temps_0_à_25],
  "journalScore": [score_journal_0_à_15],
  "goalScore": [score_objectifs_0_à_15],
  "insights": [
    "insight_spécifique_basé_données_réelles_1",
    "insight_spécifique_basé_données_réelles_2",
    "insight_spécifique_basé_données_réelles_3"
  ],
  "recommendations": [
    "recommandation_concrète_personnalisée_1",
    "recommandation_concrète_personnalisée_2", 
    "recommandation_concrète_personnalisée_3"
  ],
  "detailedBreakdown": {
    "tasksCompleted": ${userData.tasks.filter(t => t.completed).length},
    "totalTasks": ${userData.tasks.length},
    "habitsCompleted": ${userData.habit_completions.length},
    "totalHabits": ${userData.habits.length},
    "focusTimeMinutes": ${userData.focus_sessions.reduce((acc, f) => acc + (f.duration || 0), 0)},
    "journalEntries": ${userData.journal_entries.length},
    "goalsAchieved": ${userData.goals.filter(g => g.completed).length},
    "totalGoals": ${userData.goals.length}
  }
}

CALCULS REQUIS:
1. Score global = moyenne pondérée des sous-scores
2. Insights basés sur les vraies performances observées
3. Recommandations adaptées aux points faibles identifiés
4. Tous les scores doivent refléter les données réelles, pas des estimations`,
            user_id: user.id,
            context: {
              analysis_mode: true,
              comprehensive_data: userData
            }
          }
        });

        if (error) {
          console.error('AI analysis error:', error);
          throw error;
        }

        let analysisData: ProductivityAnalysis;
        try {
          if (!data?.response) {
            throw new Error('Aucune réponse de l\'IA');
          }

          let jsonContent = typeof data.response === 'string' ? data.response.trim() : JSON.stringify(data.response);
          
          // Extract JSON from markdown if present
          const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/) || jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1] || jsonMatch[0];
          }
          
          analysisData = JSON.parse(jsonContent);
        } catch (parseError) {
          console.error('Erreur parsing analyse:', parseError);
          
          // Fallback with real calculations
          const tasksCompleted = userData.tasks.filter(t => t.completed).length;
          const totalTasks = userData.tasks.length;
          const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
          const focusMinutes = userData.focus_sessions.reduce((acc, f) => acc + (f.duration || 0), 0);
          const goalsAchieved = userData.goals.filter(g => g.completed).length;
          
          analysisData = {
            score: Math.round((completionRate + Math.min(focusMinutes / 10, 25) + userData.journal_entries.length * 2) / 3),
            completionRate,
            focusTimeScore: Math.min(Math.round(focusMinutes / 10), 25),
            consistencyScore: Math.min(userData.habit_completions.length * 2, 25),
            qualityScore: Math.min(goalsAchieved * 5, 25),
            timeManagementScore: Math.min(completionRate / 4, 25),
            journalScore: Math.min(userData.journal_entries.length, 15),
            goalScore: Math.min(goalsAchieved * 3, 15),
            insights: [
              `Vous avez complété ${tasksCompleted} tâches sur ${totalTasks}`,
              `${focusMinutes} minutes de focus enregistrées`,
              `${userData.journal_entries.length} entrées de journal cette période`
            ],
            recommendations: [
              completionRate < 70 ? "Concentrez-vous sur moins de tâches mais terminez-les" : "Excellent taux de completion !",
              focusMinutes < 60 ? "Augmentez vos sessions de focus" : "Bon travail sur le focus",
              userData.journal_entries.length < 5 ? "Tenez un journal plus régulièrement" : "Excellente régularité journal"
            ],
            detailedBreakdown: {
              tasksCompleted,
              totalTasks,
              habitsCompleted: userData.habit_completions.length,
              totalHabits: userData.habits.length,
              focusTimeMinutes: focusMinutes,
              journalEntries: userData.journal_entries.length,
              goalsAchieved,
              totalGoals: userData.goals.length
            }
          };
        }

        return analysisData;

      } catch (error) {
        console.error('Error in productivity analysis:', error);
        return {
          score: 0,
          completionRate: 0,
          focusTimeScore: 0,
          consistencyScore: 0,
          qualityScore: 0,
          timeManagementScore: 0,
          journalScore: 0,
          goalScore: 0,
          insights: ["Erreur lors de l'analyse des données"],
          recommendations: ["Réessayez plus tard"],
          detailedBreakdown: {
            tasksCompleted: 0,
            totalTasks: 0,
            habitsCompleted: 0,
            totalHabits: 0,
            focusTimeMinutes: 0,
            journalEntries: 0,
            goalsAchieved: 0,
            totalGoals: 0
          }
        };
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};