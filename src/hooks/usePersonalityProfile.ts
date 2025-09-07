
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

      // Appel à l'API Gemini avec un prompt optimisé
      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Analyse ces données utilisateur et génère un profil de personnalité détaillé et personnalisé en français. Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:

{
  "personality": {
    "traits": ["trait1", "trait2", "trait3"],
    "strengths": ["force1", "force2"],
    "areas_to_improve": ["amelioration1", "amelioration2"],
    "motivations": ["motivation1", "motivation2"],
    "working_style": "style_de_travail"
  },
  "psychological_insights": {
    "behavioral_patterns": ["pattern1", "pattern2"],
    "stress_management": "gestion_stress",
    "decision_making_style": "style_decision",
    "social_preferences": "preferences_sociales"
  },
  "productivity_analysis": {
    "peak_performance_times": ["moment1", "moment2"],
    "productivity_blockers": ["blocage1", "blocage2"],
    "optimal_work_environment": "environnement_optimal",
    "goal_achievement_style": "style_objectifs"
  },
  "recommendations": {
    "habits_to_develop": ["habitude1", "habitude2", "habitude3"],
    "productivity_tips": ["conseil1", "conseil2", "conseil3"],
    "personal_growth": ["croissance1", "croissance2"],
    "stress_management": ["stress1", "stress2"]
  },
  "growth_trajectory": {
    "current_phase": "phase_actuelle",
    "next_milestones": ["etape1", "etape2"],
    "long_term_potential": "potentiel_long_terme"
  }
}

Données utilisateur: ${JSON.stringify(userSummary)}

Analyse approfondie requise basée sur les patterns réels de l'utilisateur.`,
          user_id: user.id,
          hasContext: true
        }
      });

      if (error) {
        throw error;
      }

      let analysisResult;
      try {
        // Essayer de parser la réponse JSON
        const responseText = data?.choices?.[0]?.message?.content || data?.content || data;
        console.log('Réponse brute de l\'IA:', responseText);
        
        // Nettoyer le JSON s'il contient des caractères parasites
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysisResult = JSON.parse(cleanedResponse);
        
        // Valider la structure
        if (!analysisResult.personality || !analysisResult.recommendations) {
          throw new Error('Structure JSON invalide');
        }
      } catch (parseError) {
        console.error('Erreur parsing JSON:', parseError);
        throw new Error('Réponse IA invalide');
      }

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
