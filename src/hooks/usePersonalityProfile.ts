
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
    if (!user) return;

    setIsLoading(true);
    try {
      // Récupérer toutes les données utilisateur
      const [reflections, journalEntries, habits, tasks, goals, focusSessions] = await Promise.all([
        supabase.from('daily_reflections').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id)
      ]);

      const userData = {
        reflections: reflections.data || [],
        journalEntries: journalEntries.data || [],
        habits: habits.data || [],
        tasks: tasks.data || [],
        goals: goals.data || [],
        focusSessions: focusSessions.data || []
      };

      // Générer le profil avec l'IA
      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Analyse approfondie de personnalité et profil psychologique complet.

DONNÉES UTILISATEUR COMPLÈTES:
- Réflexions personnelles: ${userData.reflections.length} entrées
- Entrées de journal: ${userData.journalEntries.length} entrées  
- Habitudes: ${userData.habits.length} habitudes
- Tâches: ${userData.tasks.length} tâches
- Objectifs: ${userData.goals.length} objectifs
- Sessions de focus: ${userData.focusSessions.length} sessions

MISSION: Créer un profil de personnalité détaillé et une analyse psychologique approfondie basée sur ces données comportementales réelles.

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:
{
  "personality": {
    "traits": ["array de traits de personnalité identifiés"],
    "strengths": ["array de forces principales"],
    "areas_to_improve": ["array de domaines d'amélioration"],
    "motivations": ["array de motivations intrinsèques"],
    "working_style": "description du style de travail"
  },
  "psychological_insights": {
    "behavioral_patterns": ["array de patterns comportementaux observés"],
    "stress_management": "analyse de la gestion du stress",
    "decision_making_style": "style de prise de décision",
    "social_preferences": "préférences sociales et relationnelles"
  },
  "productivity_analysis": {
    "peak_performance_times": ["array des moments de pic de performance"],
    "productivity_blockers": ["array des obstacles à la productivité"],
    "optimal_work_environment": "environnement de travail optimal",
    "goal_achievement_style": "style d'atteinte des objectifs"
  },
  "recommendations": {
    "habits_to_develop": ["array d'habitudes à développer"],
    "productivity_tips": ["array de conseils productivité personnalisés"],
    "personal_growth": ["array de recommandations de croissance"],
    "stress_management": ["array de techniques de gestion du stress"]
  },
  "growth_trajectory": {
    "current_phase": "phase actuelle de développement",
    "next_milestones": ["array des prochains jalons"],
    "long_term_potential": "potentiel de développement à long terme"
  }
}

ANALYSE REQUISE:
- Patterns dans les réflexions et journaux pour identifier la personnalité
- Corrélations entre habitudes et traits psychologiques
- Analyse des objectifs pour comprendre les motivations profondes
- Examen des tâches pour identifier les préférences de travail
- Évaluation des sessions de focus pour optimiser la productivité
- Insights psychologiques basés sur les comportements observés`,
          user_id: user.id,
          context: {
            analysis_mode: true,
            user_data: userData
          }
        }
      });

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
      
    } catch (error) {
      console.error('Erreur génération profil:', error);
      toast.error('Erreur lors de la génération du profil');
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
