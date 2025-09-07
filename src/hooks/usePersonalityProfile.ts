
import { useState } from 'react';
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

  const generateProfile = async () => {
    if (!user) {
      console.log('Pas d\'utilisateur connecté');
      return;
    }

    console.log('Début de la génération du profil pour l\'utilisateur:', user.id);
    setIsLoading(true);
    try {
      // Récupérer toutes les données utilisateur importantes
      const [habitsResult, goalsResult, tasksResult, journalResult, focusResult, habitCompletionsResult] = await Promise.allSettled([
        supabase.from('habits').select('title, description, frequency, streak, category').eq('user_id', user.id).limit(8),
        supabase.from('goals').select('title, description, progress, completed, category').eq('user_id', user.id).limit(6),
        supabase.from('tasks').select('title, completed, priority, created_at').eq('user_id', user.id).limit(12),
        supabase.from('journal_entries').select('mood, tags').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('focus_sessions').select('duration, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('habit_completions').select('completed_date').eq('user_id', user.id).order('completed_date', { ascending: false }).limit(15)
      ]);

      // Extraire les données de manière sécurisée
      const habits = habitsResult.status === 'fulfilled' ? habitsResult.value.data || [] : [];
      const goals = goalsResult.status === 'fulfilled' ? goalsResult.value.data || [] : [];
      const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : [];
      const journal = journalResult.status === 'fulfilled' ? journalResult.value.data || [] : [];
      const focus = focusResult.status === 'fulfilled' ? focusResult.value.data || [] : [];
      const habitCompletions = habitCompletionsResult.status === 'fulfilled' ? habitCompletionsResult.value.data || [] : [];

      // Créer un résumé compact pour l'IA
      const userSummary = {
        habitudes: {
          total: habits.length,
          categories: [...new Set(habits.map(h => h.category).filter(Boolean))],
          streak_moyen: Math.round(habits.reduce((acc, h) => acc + (h.streak || 0), 0) / Math.max(habits.length, 1)),
          completions_recentes: habitCompletions.length
        },
        objectifs: {
          total: goals.length,
          termines: goals.filter(g => g.completed).length,
          progress_moyen: Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / Math.max(goals.length, 1)),
          categories: [...new Set(goals.map(g => g.category).filter(Boolean))]
        },
        taches: {
          total: tasks.length,
          terminees: tasks.filter(t => t.completed).length,
          priorites: tasks.map(t => t.priority).filter(Boolean)
        },
        journal: {
          entrees: journal.length,
          humeurs: journal.map(j => j.mood).filter(Boolean),
          tags_frequents: journal.flatMap(j => j.tags || []).slice(0, 6)
        },
        focus: {
          sessions: focus.length,
          duree_totale: focus.reduce((acc, f) => acc + (f.duration || 0), 0),
          duree_moyenne: focus.length > 0 ? Math.round(focus.reduce((acc, f) => acc + (f.duration || 0), 0) / focus.length) : 0
        }
      };

      // Tenter d'abord l'API Gemini, puis fallback sur analyse locale
      try {
        const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
          body: {
            message: `Génère un profil de personnalité JSON basé sur ces données: ${JSON.stringify(userSummary)}`,
            user_id: user.id,
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
              toast.success('Profil de personnalité généré avec l\'IA !');
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
      toast.success('Profil de personnalité généré avec succès !');
      
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
    generateProfile
  };
};

// Fonctions d'analyse basées sur les données réelles
const generatePersonalityTraits = (data: any) => {
  const traits = [];
  if (data.taches.terminees > data.taches.total * 0.7) traits.push("déterminé");
  if (data.habitudes.total > 3) traits.push("discipliné");
  if (data.focus.sessions > 5) traits.push("concentré");
  if (data.objectifs.termines > 0) traits.push("ambitieux");
  return traits.length > 0 ? traits : ["motivé", "organisé"];
};

const generateStrengths = (data: any) => {
  const strengths = [];
  if (data.habitudes.streak_moyen > 5) strengths.push("constance dans les habitudes");
  if (data.taches.terminees / Math.max(data.taches.total, 1) > 0.6) strengths.push("efficacité dans l'exécution");
  if (data.focus.duree_totale > 120) strengths.push("capacité de concentration");
  return strengths.length > 0 ? strengths : ["motivation", "persévérance"];
};

const generateImprovementAreas = (data: any) => {
  const areas = [];
  if (data.focus.duree_totale < 60) areas.push("temps de concentration");
  if (data.taches.terminees / Math.max(data.taches.total, 1) < 0.5) areas.push("gestion des tâches");
  if (data.habitudes.completions_recentes < 3) areas.push("régularité des habitudes");
  return areas.length > 0 ? areas : ["équilibre vie-travail", "gestion du stress"];
};

const generateMotivations = (data: any) => {
  const motivations = [];
  if (data.objectifs.total > 2) motivations.push("accomplissement d'objectifs");
  if (data.habitudes.total > 2) motivations.push("amélioration continue");
  motivations.push("développement personnel");
  return motivations;
};

const generateWorkingStyle = (data: any) => {
  if (data.focus.sessions > 5) return "focalisé sur la concentration";
  if (data.taches.total > 10) return "orienté tâches";
  return "équilibré et adaptable";
};

const generateBehavioralPatterns = (data: any) => {
  const patterns = [];
  if (data.habitudes.total > 0) patterns.push("formation d'habitudes");
  if (data.focus.sessions > 0) patterns.push("sessions de travail focalisé");
  patterns.push("planification d'objectifs");
  return patterns;
};

const generateStressManagement = (data: any) => {
  if (data.focus.duree_moyenne > 30) return "gestion par la concentration";
  if (data.habitudes.total > 3) return "gestion par les routines";
  return "approche équilibrée";
};

const generateDecisionStyle = (data: any) => {
  if (data.objectifs.progress_moyen > 50) return "orienté résultats";
  if (data.taches.priorites.includes("high")) return "priorise l'urgence";
  return "réfléchi et méthodique";
};

const generateSocialPreferences = (data: any) => {
  if (data.focus.sessions > 3) return "préfère le travail concentré";
  return "équilibre social et travail";
};

const generatePeakTimes = (data: any) => {
  const times = [];
  if (data.focus.sessions > 0) times.push("périodes de focus planifiées");
  times.push("matinée");
  return times;
};

const generateBlockers = (data: any) => {
  const blockers = [];
  if (data.taches.terminees / Math.max(data.taches.total, 1) < 0.5) blockers.push("procrastination");
  if (data.focus.duree_totale < 60) blockers.push("difficultés de concentration");
  return blockers.length > 0 ? blockers : ["distractions", "surcharge de tâches"];
};

const generateOptimalEnvironment = (data: any) => {
  if (data.focus.sessions > 3) return "environnement calme et organisé";
  return "espace flexible et adaptatif";
};

const generateGoalStyle = (data: any) => {
  if (data.objectifs.progress_moyen > 60) return "approche progressive et mesurée";
  if (data.objectifs.total > 2) return "objectifs multiples et ambitieux";
  return "approche étape par étape";
};

const generateHabitRecommendations = (data: any) => {
  const recommendations = [];
  if (data.focus.duree_totale < 60) recommendations.push("sessions de concentration quotidiennes");
  if (data.habitudes.total < 3) recommendations.push("routine matinale structurée");
  recommendations.push("pause active régulière");
  return recommendations;
};

const generateProductivityTips = (data: any) => {
  const tips = [];
  if (data.taches.terminees / Math.max(data.taches.total, 1) < 0.6) tips.push("technique Pomodoro");
  if (data.objectifs.progress_moyen < 50) tips.push("décomposition d'objectifs");
  tips.push("planification hebdomadaire");
  return tips;
};

const generateGrowthRecommendations = (data: any) => {
  const growth = [];
  if (data.journal.entrees < 3) growth.push("tenue de journal régulière");
  growth.push("auto-évaluation mensuelle");
  growth.push("lecture de développement personnel");
  return growth;
};

const generateStressRecommendations = (data: any) => {
  const stress = [];
  if (data.focus.duree_moyenne < 25) stress.push("techniques de respiration");
  stress.push("pauses régulières");
  stress.push("activité physique");
  return stress;
};

const generateCurrentPhase = (data: any) => {
  if (data.habitudes.total > 3 && data.objectifs.progress_moyen > 50) return "phase d'optimisation";
  if (data.taches.total > 5) return "phase de développement actif";
  return "phase d'établissement des bases";
};

const generateMilestones = (data: any) => {
  const milestones = [];
  if (data.habitudes.streak_moyen < 7) milestones.push("maintenir 7 jours d'habitudes");
  if (data.taches.terminees / Math.max(data.taches.total, 1) < 0.8) milestones.push("atteindre 80% de tâches complétées");
  milestones.push("développer une routine optimale");
  return milestones;
};

const generateLongTermPotential = (data: any) => {
  if (data.objectifs.total > 2 && data.habitudes.total > 3) return "expert en productivité personnelle";
  if (data.focus.sessions > 3) return "maître de la concentration";
  return "développeur de systèmes personnels efficaces";
};
