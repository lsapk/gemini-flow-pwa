import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PersonalityProfile {
  personality: {
    traits: string[];
    strengths: string[];
    areas_to_improve: string[];
    motivations: string[];
    working_style: string;
  };
  psychological_insights: {
    behavioral_patterns: string[];
    stress_management: string;
    decision_making_style: string;
    social_preferences: string;
  };
  productivity_analysis: {
    peak_performance_times: string[];
    productivity_blockers: string[];
    optimal_work_environment: string;
    goal_achievement_style: string;
  };
  recommendations: {
    habits_to_develop: string[];
    productivity_tips: string[];
    personal_growth: string[];
    stress_management: string[];
  };
  growth_trajectory: {
    current_phase: string;
    next_milestones: string[];
    long_term_potential: string;
  };
}

export const usePersonalityProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load saved profile on mount
  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }
    
    const loadSavedProfile = async () => {
      try {
        setIsInitialLoading(true);
        const { data, error } = await supabase
          .from('ai_personality_profiles')
          .select('profile_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.profile_data) {
          setProfile(data.profile_data as unknown as PersonalityProfile);
        }
      } catch (error) {
        console.error("Error loading saved profile:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadSavedProfile();
  }, [user]);

  const generateProfile = async () => {
    if (!user) {
      console.log('Pas d\'utilisateur connecté');
      return;
    }

    console.log('Début de la génération du profil pour l\'utilisateur:', user.id);
    setIsLoading(true);
    try {
      // Récupérer TOUTES les données utilisateur sans limites strictes
      const [habitsResult, goalsResult, tasksResult, journalResult, focusResult, habitCompletionsResult, reflectionsResult] = await Promise.allSettled([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('habit_completions').select('*').eq('user_id', user.id).order('completed_date', { ascending: false }).limit(100),
        supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
      ]);

      // Extraire les données de manière sécurisée
      const habits = habitsResult.status === 'fulfilled' ? habitsResult.value.data || [] : [];
      const goals = goalsResult.status === 'fulfilled' ? goalsResult.value.data || [] : [];
      const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : [];
      const journal = journalResult.status === 'fulfilled' ? journalResult.value.data || [] : [];
      const focus = focusResult.status === 'fulfilled' ? focusResult.value.data || [] : [];
      const habitCompletions = habitCompletionsResult.status === 'fulfilled' ? habitCompletionsResult.value.data || [] : [];
      const reflections = reflectionsResult.status === 'fulfilled' ? reflectionsResult.value.data || [] : [];

      console.log('Données récupérées:', { habits: habits.length, goals: goals.length, tasks: tasks.length, journal: journal.length, focus: focus.length });

      // Calculer des métriques avancées
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Analyse temporelle des habitudes
      const recentHabitCompletions = habitCompletions.filter(hc => new Date(hc.completed_date) > last30Days);
      const habitConsistencyRate = habits.length > 0 ? (recentHabitCompletions.length / (habits.length * 30)) * 100 : 0;

      // Analyse des tâches
      const completedTasks = tasks.filter(t => t.completed);
      const taskCompletionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
      const recentTasks = tasks.filter(t => new Date(t.created_at) > last7Days);
      const highPriorityTasks = tasks.filter(t => t.priority === 'high');
      const highPriorityCompleted = highPriorityTasks.filter(t => t.completed);

      // Analyse des objectifs
      const activeGoals = goals.filter(g => !g.completed && !g.is_archived);
      const completedGoals = goals.filter(g => g.completed);
      const avgGoalProgress = activeGoals.length > 0 ? activeGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / activeGoals.length : 0;

      // Analyse du focus
      const recentFocus = focus.filter(f => new Date(f.created_at) > last30Days);
      const totalFocusTime = recentFocus.reduce((acc, f) => acc + (f.duration || 0), 0);
      const avgFocusSession = recentFocus.length > 0 ? totalFocusTime / recentFocus.length : 0;
      const focusFrequency = recentFocus.length / 30;

      // Analyse du journal
      const recentJournals = journal.filter(j => new Date(j.created_at) > last30Days);
      const moodDistribution = recentJournals.reduce((acc, j) => {
        const mood = j.mood || 'unknown';
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const dominantMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

      // Patterns temporels
      const tasksByDayOfWeek = tasks.reduce((acc, t) => {
        const day = new Date(t.created_at).getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const mostProductiveDay = Object.entries(tasksByDayOfWeek).sort((a, b) => b[1] - a[1])[0]?.[0];

      const focusByHour = focus.reduce((acc, f) => {
        const hour = new Date(f.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const peakFocusHour = Object.entries(focusByHour).sort((a, b) => b[1] - a[1])[0]?.[0];

      // Créer un résumé détaillé pour une analyse psychologique approfondie
      const userSummary = {
        vue_generale: {
          total_habitudes: habits.length,
          total_objectifs: goals.length,
          total_taches: tasks.length,
          total_sessions_focus: focus.length,
          total_entrees_journal: journal.length,
          total_reflexions: reflections.length
        },
        metriques_performance: {
          taux_completion_taches: Math.round(taskCompletionRate),
          taux_completion_objectifs: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0,
          consistance_habitudes: Math.round(habitConsistencyRate),
          progression_objectifs_moyenne: Math.round(avgGoalProgress),
          temps_focus_total_30j: Math.round(totalFocusTime),
          duree_moyenne_focus: Math.round(avgFocusSession),
          frequence_focus_quotidienne: focusFrequency.toFixed(1)
        },
        analyse_habitudes: {
          habitudes_actives: habits.filter(h => !h.is_archived).length,
          meilleur_streak: Math.max(...habits.map(h => h.streak || 0), 0),
          streak_moyen: Math.round(habits.reduce((acc, h) => acc + (h.streak || 0), 0) / Math.max(habits.length, 1)),
          categories: [...new Set(habits.map(h => h.category).filter(Boolean))],
          frequences: habits.map(h => ({ titre: h.title, freq: h.frequency, streak: h.streak })),
          completions_30_derniers_jours: recentHabitCompletions.length
        },
        analyse_objectifs: {
          objectifs_actifs: activeGoals.length,
          objectifs_completes: completedGoals.length,
          objectifs_archives: goals.filter(g => g.is_archived).length,
          categories: [...new Set(goals.map(g => g.category).filter(Boolean))],
          details: goals.map(g => ({
            titre: g.title,
            progression: g.progress,
            complete: g.completed,
            categorie: g.category,
            description: g.description?.substring(0, 100)
          }))
        },
        analyse_taches: {
          taches_completees: completedTasks.length,
          taches_en_cours: tasks.length - completedTasks.length,
          taches_haute_priorite: highPriorityTasks.length,
          taux_completion_haute_priorite: highPriorityTasks.length > 0 ? Math.round((highPriorityCompleted.length / highPriorityTasks.length) * 100) : 0,
          taches_recentes_7j: recentTasks.length,
          repartition_priorites: {
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
          },
          objectifs_lies: tasks.filter(t => t.linked_goal_id).length
        },
        analyse_focus: {
          sessions_30j: recentFocus.length,
          temps_total_minutes: Math.round(totalFocusTime),
          temps_moyen_session: Math.round(avgFocusSession),
          sessions_par_jour: focusFrequency.toFixed(1),
          heure_pic_concentration: peakFocusHour || 'non défini',
          sessions_recentes: recentFocus.slice(0, 10).map(f => ({
            duree: f.duration,
            date: f.created_at,
            titre: f.title
          }))
        },
        analyse_emotionnelle: {
          entrees_journal_30j: recentJournals.length,
          humeur_dominante: dominantMood,
          distribution_humeurs: moodDistribution,
          frequence_journaling: (recentJournals.length / 30).toFixed(1),
          reflexions_recentes: reflections.length,
          themes_journal: recentJournals.flatMap(j => j.tags || []).filter(Boolean)
        },
        patterns_comportementaux: {
          jour_plus_productif: mostProductiveDay ? ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][parseInt(mostProductiveDay)] : 'non défini',
          heure_pic_focus: peakFocusHour || 'non défini',
          regularite_hebdomadaire: Object.values(tasksByDayOfWeek).length,
          style_travail: avgFocusSession > 45 ? 'sessions longues' : avgFocusSession > 25 ? 'sessions moyennes' : 'sessions courtes'
        },
        contexte_psychologique: {
          niveau_engagement: habitConsistencyRate > 70 ? 'élevé' : habitConsistencyRate > 40 ? 'moyen' : 'faible',
          orientation_objectifs: activeGoals.length > completedGoals.length ? 'ambitieux' : 'pragmatique',
          gestion_priorites: highPriorityTasks.length > tasks.length * 0.3 ? 'orienté urgence' : 'équilibré',
          pratique_reflexive: recentJournals.length > 15 ? 'très régulière' : recentJournals.length > 5 ? 'régulière' : 'occasionnelle'
        }
      };

      console.log('Résumé utilisateur créé avec métriques avancées');

      // Tenter d'abord l'API Gemini avec analyse approfondie
      try {
        console.log('Invocation de l\'IA pour analyse psychologique approfondie...');
        const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
          body: {
            message: `ANALYSE PSYCHOLOGIQUE APPROFONDIE - Profil de Personnalité

Tu dois analyser en profondeur toutes ces données et créer un profil psychologique vraiment personnalisé et utile.

DONNÉES COMPLÈTES DE L'UTILISATEUR:
${JSON.stringify(userSummary, null, 2)}

INSTRUCTIONS CRITIQUES:
1. Analyse RÉELLEMENT toutes les métriques et patterns fournis
2. Identifie des traits psychologiques spécifiques basés sur les comportements observés
3. Fais des connexions entre les différentes données (ex: lien entre humeur et productivité)
4. Sois PRÉCIS et PERSONNALISÉ - évite les généralités
5. Utilise les chiffres et patterns réels pour justifier tes insights
6. Identifie des blocages psychologiques potentiels basés sur les patterns
7. Propose des recommandations vraiment adaptées au profil comportemental observé

FORMAT DE RÉPONSE (JSON strict, sans texte avant/après):
{
  "personality": {
    "traits": ["3-5 traits psychologiques SPÉCIFIQUES déduits des patterns comportementaux"],
    "strengths": ["3-5 forces RÉELLES identifiées dans les données"],
    "areas_to_improve": ["2-4 zones d'amélioration CONCRÈTES basées sur les métriques"],
    "motivations": ["2-4 motivations DÉDUITES du type d'objectifs et habitudes"],
    "working_style": "Description DÉTAILLÉE du style de travail basée sur les patterns de focus et tâches"
  },
  "psychological_insights": {
    "behavioral_patterns": ["3-5 patterns comportementaux OBSERVÉS dans les données"],
    "stress_management": "Analyse du stress basée sur humeurs, focus et régularité",
    "decision_making_style": "Style de décision déduit des priorités et choix d'objectifs",
    "social_preferences": "Préférences déduites du type d'objectifs et réflexions"
  },
  "productivity_analysis": {
    "peak_performance_times": ["Moments identifiés dans les données de focus et tâches"],
    "productivity_blockers": ["Blocages RÉELS identifiés dans les patterns"],
    "optimal_work_environment": "Environnement optimal basé sur les sessions de focus réussies",
    "goal_achievement_style": "Style basé sur la progression réelle des objectifs"
  },
  "recommendations": {
    "habits_to_develop": ["3-5 habitudes SPÉCIFIQUES pour combler les gaps identifiés"],
    "productivity_tips": ["3-5 tips PERSONNALISÉS basés sur le profil"],
    "personal_growth": ["3-5 conseils de croissance ADAPTÉS aux zones d'amélioration"],
    "stress_management": ["3-5 techniques APPROPRIÉES au profil de stress observé"]
  },
  "growth_trajectory": {
    "current_phase": "Phase actuelle déduite des métriques de progression",
    "next_milestones": ["3-4 jalons LOGIQUES basés sur les objectifs et progression actuels"],
    "long_term_potential": "Potentiel basé sur les tendances et la consistance observées"
  }
}

Réponds UNIQUEMENT avec le JSON valide, aucun texte supplémentaire.`,
            context: {
              analysis_mode: true,
              user_data: userSummary
            }
          }
        });

        if (!error && data?.response) {
          let responseText = data.response;
          console.log('Réponse IA reçue:', responseText);
          
          if (typeof responseText === 'string') {
            const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const analysisResult = JSON.parse(cleanedResponse);
            
            if (analysisResult.personality) {
              setProfile(analysisResult);
              
              // Save to database
              await supabase
                .from('ai_personality_profiles')
                .upsert({
                  user_id: user.id,
                  profile_data: analysisResult as any
                });
              
              toast.success('Profil de personnalité généré et sauvegardé !');
              return;
            }
          }
        }
      } catch (aiError) {
        console.log('API IA non disponible, utilisation de l\'analyse locale:', aiError);
      }

      // Fallback : génération basée sur les vraies données utilisateur
      console.log('Génération du profil basé sur les données réelles...');
      
      const analysisResult: PersonalityProfile = {
        personality: {
          traits: generatePersonalityTraits(userSummary),
          strengths: generateStrengths(userSummary),
          areas_to_improve: generateImprovementAreas(userSummary),
          motivations: generateMotivations(userSummary),
          working_style: generateWorkingStyle(userSummary)
        },
        psychological_insights: {
          behavioral_patterns: generateBehavioralPatterns(userSummary),
          stress_management: generateStressManagement(userSummary),
          decision_making_style: generateDecisionStyle(userSummary),
          social_preferences: generateSocialPreferences(userSummary)
        },
        productivity_analysis: {
          peak_performance_times: generatePeakTimes(userSummary),
          productivity_blockers: generateBlockers(userSummary),
          optimal_work_environment: generateOptimalEnvironment(userSummary),
          goal_achievement_style: generateGoalStyle(userSummary)
        },
        recommendations: {
          habits_to_develop: generateHabitRecommendations(userSummary),
          productivity_tips: generateProductivityTips(userSummary),
          personal_growth: generateGrowthRecommendations(userSummary),
          stress_management: generateStressRecommendations(userSummary)
        },
        growth_trajectory: {
          current_phase: generateCurrentPhase(userSummary),
          next_milestones: generateMilestones(userSummary),
          long_term_potential: generateLongTermPotential(userSummary)
        }
      };

      setProfile(analysisResult);
      
      // Save to database
      await supabase
        .from('ai_personality_profiles')
        .upsert({
          user_id: user.id,
          profile_data: analysisResult as any
        });
      
      toast.success('Profil de personnalité généré et sauvegardé !');
      
    } catch (error: any) {
      console.error('Erreur génération profil:', error);
      
      // Gestion des erreurs spécifiques
      if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
        toast.error('Limite d\'API atteinte. Réessayez dans quelques minutes.');
      } else if (error?.message?.includes('Réponse IA invalide')) {
        toast.error('Erreur dans l\'analyse IA. Réessayez.');
      } else {
        toast.error('Erreur lors de la génération du profil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading,
    isInitialLoading,
    generateProfile
  };
};

// Fonctions d'analyse basées sur les données réelles
const generatePersonalityTraits = (data: any) => {
  const traits = [];
  const taskCompletionRate = data.metriques_performance?.taux_completion_taches || 0;
  if (taskCompletionRate > 70) traits.push("déterminé");
  if (data.vue_generale?.total_habitudes > 3) traits.push("discipliné");
  if (data.analyse_focus?.sessions_30j > 5) traits.push("concentré");
  if (data.analyse_objectifs?.objectifs_completes > 0) traits.push("ambitieux");
  return traits.length > 0 ? traits : ["motivé", "organisé"];
};

const generateStrengths = (data: any) => {
  const strengths = [];
  if (data.analyse_habitudes?.streak_moyen > 5) strengths.push("constance dans les habitudes");
  const taskCompletionRate = data.metriques_performance?.taux_completion_taches || 0;
  if (taskCompletionRate > 60) strengths.push("efficacité dans l'exécution");
  if (data.analyse_focus?.temps_total_minutes > 120) strengths.push("capacité de concentration");
  return strengths.length > 0 ? strengths : ["motivation", "persévérance"];
};

const generateImprovementAreas = (data: any) => {
  const areas = [];
  if (data.analyse_focus?.temps_total_minutes < 60) areas.push("temps de concentration");
  const taskCompletionRate = data.metriques_performance?.taux_completion_taches || 0;
  if (taskCompletionRate < 50) areas.push("gestion des tâches");
  if (data.analyse_habitudes?.completions_30_derniers_jours < 3) areas.push("régularité des habitudes");
  return areas.length > 0 ? areas : ["équilibre vie-travail", "gestion du stress"];
};

const generateMotivations = (data: any) => {
  const motivations = [];
  if (data.vue_generale?.total_objectifs > 2) motivations.push("accomplissement d'objectifs");
  if (data.vue_generale?.total_habitudes > 2) motivations.push("amélioration continue");
  motivations.push("développement personnel");
  return motivations;
};

const generateWorkingStyle = (data: any) => {
  if (data.analyse_focus?.sessions_30j > 5) return "focalisé sur la concentration";
  if (data.vue_generale?.total_taches > 10) return "orienté tâches";
  return "équilibré et adaptable";
};

const generateBehavioralPatterns = (data: any) => {
  const patterns = [];
  if (data.analyse_habitudes?.habitudes_actives > 0) patterns.push("formation d'habitudes");
  if (data.analyse_focus?.sessions_30j > 0) patterns.push("sessions de travail focalisé");
  patterns.push("planification d'objectifs");
  return patterns;
};

const generateStressManagement = (data: any) => {
  if (data.analyse_focus?.temps_moyen_session > 30) return "gestion par la concentration";
  if (data.analyse_habitudes?.habitudes_actives > 3) return "gestion par les routines";
  return "approche équilibrée";
};

const generateDecisionStyle = (data: any) => {
  if (data.metriques_performance?.progression_objectifs_moyenne > 50) return "orienté résultats";
  if (data.analyse_taches?.taches_haute_priorite > 0) return "priorise l'urgence";
  return "réfléchi et méthodique";
};

const generateSocialPreferences = (data: any) => {
  if (data.analyse_focus?.sessions_30j > 3) return "préfère le travail concentré";
  return "équilibre social et travail";
};

const generatePeakTimes = (data: any) => {
  const times = [];
  if (data.analyse_focus?.sessions_30j > 0) times.push("périodes de focus planifiées");
  times.push("matinée");
  return times;
};

const generateBlockers = (data: any) => {
  const blockers = [];
  const taskCompletionRate = data.metriques_performance?.taux_completion_taches || 0;
  if (taskCompletionRate < 50) blockers.push("procrastination");
  if (data.analyse_focus?.temps_total_minutes < 60) blockers.push("difficultés de concentration");
  return blockers.length > 0 ? blockers : ["distractions", "surcharge de tâches"];
};

const generateOptimalEnvironment = (data: any) => {
  if (data.analyse_focus?.sessions_30j > 3) return "environnement calme et organisé";
  return "espace flexible et adaptatif";
};

const generateGoalStyle = (data: any) => {
  if (data.metriques_performance?.progression_objectifs_moyenne > 60) return "approche progressive et mesurée";
  if (data.vue_generale?.total_objectifs > 2) return "objectifs multiples et ambitieux";
  return "approche étape par étape";
};

const generateHabitRecommendations = (data: any) => {
  const recommendations = [];
  if (data.analyse_focus?.temps_total_minutes < 60) recommendations.push("sessions de concentration quotidiennes");
  if (data.vue_generale?.total_habitudes < 3) recommendations.push("routine matinale structurée");
  recommendations.push("pause active régulière");
  return recommendations;
};

const generateProductivityTips = (data: any) => {
  const tips = [];
  const taskCompletionRate = data.metriques_performance?.taux_completion_taches || 0;
  if (taskCompletionRate < 60) tips.push("technique Pomodoro");
  if (data.metriques_performance?.progression_objectifs_moyenne < 50) tips.push("décomposition d'objectifs");
  tips.push("planification hebdomadaire");
  return tips;
};

const generateGrowthRecommendations = (data: any) => {
  const growth = [];
  if (data.vue_generale?.total_entrees_journal < 3) growth.push("tenue de journal régulière");
  growth.push("auto-évaluation mensuelle");
  growth.push("lecture de développement personnel");
  return growth;
};

const generateStressRecommendations = (data: any) => {
  const stress = [];
  if (data.metriques_performance?.duree_moyenne_focus < 25) stress.push("techniques de respiration");
  stress.push("pauses régulières");
  stress.push("activité physique");
  return stress;
};

const generateCurrentPhase = (data: any) => {
  if (data.vue_generale?.total_habitudes > 3 && data.metriques_performance?.progression_objectifs_moyenne > 50) return "phase d'optimisation";
  if (data.vue_generale?.total_taches > 5) return "phase de développement actif";
  return "phase d'établissement des bases";
};

const generateMilestones = (data: any) => {
  const milestones = [];
  if (data.analyse_habitudes?.streak_moyen < 7) milestones.push("maintenir 7 jours d'habitudes");
  const taskCompletionRate = data.metriques_performance?.taux_completion_taches || 0;
  if (taskCompletionRate < 80) milestones.push("atteindre 80% de tâches complétées");
  milestones.push("développer une routine optimale");
  return milestones;
};

const generateLongTermPotential = (data: any) => {
  if (data.vue_generale?.total_objectifs > 2 && data.vue_generale?.total_habitudes > 3) return "expert en productivité personnelle";
  if (data.analyse_focus?.sessions_30j > 3) return "maître de la concentration";
  return "développeur de systèmes personnels efficaces";
};
