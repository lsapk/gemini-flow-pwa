
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
      // Récupérer données utilisateur limitées pour économiser tokens
      const [habits, goals, tasks] = await Promise.all([
        supabase.from('habits').select('title, description').eq('user_id', user.id).limit(10),
        supabase.from('goals').select('title, description').eq('user_id', user.id).limit(5),
        supabase.from('tasks').select('title, completed, priority').eq('user_id', user.id).limit(15)
      ]);

      // Créer résumé condensé pour éviter quota limits
      const statsOnly = {
        habitsCount: habits.data?.length || 0,
        goalsCount: goals.data?.length || 0,
        tasksCount: tasks.data?.length || 0,
        completedTasks: tasks.data?.filter(t => t.completed).length || 0,
        habitTitles: habits.data?.slice(0, 5).map(h => h.title) || [],
        goalTitles: goals.data?.slice(0, 3).map(g => g.title) || []
      };

      // Prompt ultra-court pour API gratuite
      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Analyse: ${statsOnly.habitsCount} habitudes, ${statsOnly.goalsCount} objectifs, ${statsOnly.completedTasks}/${statsOnly.tasksCount} tâches terminées.

Retourne JSON uniquement:
{
  "personality": {
    "traits": ["3 traits"],
    "strengths": ["2 forces"],
    "areas_to_improve": ["2 améliorations"],
    "motivations": ["2 motivations"],
    "working_style": "style"
  },
  "psychological_insights": {
    "behavioral_patterns": ["2 patterns"],
    "stress_management": "analyse courte",
    "decision_making_style": "style court",
    "social_preferences": "préférences courtes"
  },
  "productivity_analysis": {
    "peak_performance_times": ["2 moments"],
    "productivity_blockers": ["2 obstacles"],
    "optimal_work_environment": "environnement",
    "goal_achievement_style": "style"
  },
  "recommendations": {
    "habits_to_develop": ["3 habitudes"],
    "productivity_tips": ["3 conseils"],
    "personal_growth": ["2 recommandations"],
    "stress_management": ["2 techniques"]
  },
  "growth_trajectory": {
    "current_phase": "phase",
    "next_milestones": ["2 jalons"],
    "long_term_potential": "potentiel"
  }
}`,
          user_id: user.id
        }
      });

      console.log('Réponse de l\'API:', { data, error });

      if (error) throw error;

      // Parser la réponse JSON
      let profileData: PersonalityProfile;
      try {
        if (typeof data?.response === 'string') {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            profileData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } else {
            profileData = JSON.parse(data.response);
          }
        } else {
          profileData = data?.response || data;
        }
      } catch (parseError) {
        console.error('Erreur de parsing:', parseError);
        throw new Error('Erreur lors de l\'analyse des données');
      }

      setProfile(profileData);
      toast.success('Profil de personnalité généré avec succès !');
      
    } catch (error: any) {
      console.error('Erreur génération profil:', error);
      
      // Check if it's a quota error
      if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
        toast.error('Limite d\'API atteinte - Quota journalier dépassé (50 requêtes/jour). Réessayez demain.');
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
