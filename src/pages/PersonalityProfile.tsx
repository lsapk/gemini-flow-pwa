
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, User, Target, Heart, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface PersonalityProfile {
  personalityType: string;
  coreTraits: string[];
  motivationStyle: string;
  stressPatterns: string[];
  workingStyle: string;
  emotionalProfile: string;
  strengthsAnalysis: string[];
  growthAreas: string[];
  personalizedRecommendations: string[];
  psychologicalInsights: string[];
  progressionPath: string;
  mentalHealthScore: number;
  adaptabilityIndex: number;
  resilienceLevel: number;
  creativityIndex: number;
  socialEngagement: number;
}

export default function PersonalityProfile() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const { user } = useAuth();

  const generateProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Récupération de toutes les données utilisateur
      const [
        reflectionsResult,
        tasksResult,
        habitsResult,
        goalsResult,
        journalResult,
        focusResult,
        completionsResult
      ] = await Promise.allSettled([
        supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('habit_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
      ]);

      const reflections = reflectionsResult.status === 'fulfilled' ? (reflectionsResult.value.data || []) : [];
      const tasks = tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [];
      const habits = habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [];
      const goals = goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [];
      const journal = journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [];
      const focus = focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [];
      const completions = completionsResult.status === 'fulfilled' ? (completionsResult.value.data || []) : [];

      console.log('Generating personality profile with data:', {
        reflections: reflections.length,
        tasks: tasks.length,
        habits: habits.length,
        goals: goals.length,
        journal: journal.length,
        focus: focus.length,
        completions: completions.length
      });

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `En tant que psychologue professionnel, analyse en profondeur cette personne et crée un profil psychologique complet. Retourne UNIQUEMENT un objet JSON avec cette structure exacte:

{
  "personalityType": "string_type_de_personnalité_précis",
  "coreTraits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "motivationStyle": "string_style_de_motivation_détaillé",
  "stressPatterns": ["pattern1", "pattern2", "pattern3"],
  "workingStyle": "string_style_de_travail_préféré",
  "emotionalProfile": "string_profil_émotionnel_détaillé",
  "strengthsAnalysis": ["force1", "force2", "force3", "force4"],
  "growthAreas": ["domaine1", "domaine2", "domaine3"],
  "personalizedRecommendations": ["conseil1", "conseil2", "conseil3", "conseil4", "conseil5"],
  "psychologicalInsights": ["insight1", "insight2", "insight3", "insight4"],
  "progressionPath": "string_chemin_de_développement_personnel",
  "mentalHealthScore": nombre_0_à_100,
  "adaptabilityIndex": nombre_0_à_100,
  "resilienceLevel": nombre_0_à_100,
  "creativityIndex": nombre_0_à_100,
  "socialEngagement": nombre_0_à_100
}

ANALYSE PSYCHOLOGIQUE APPROFONDIE REQUISE:
- Patterns comportementaux dans les habitudes et leur régularité
- Style de gestion des priorités et procrastination
- Résilience face aux défis (tâches en retard, habitudes interrompues)
- Motivation intrinsèque vs extrinsèque (types d'objectifs choisis)
- Équilibre vie personnelle/professionnelle (diversité des habitudes)
- Gestion émotionnelle (journalisation, réflexions)
- Capacité d'auto-régulation (focus, discipline)
- Patterns de pensée (optimisme/pessimisme dans les réflexions)
- Style d'apprentissage et de croissance
- Relations avec l'effort et la persévérance
- Créativité et innovation dans les approches
- Capacité d'introspection et de self-awareness

Données complètes de l'utilisateur: ${JSON.stringify({
  reflections: reflections.map(r => ({ question: r.question, answer: r.answer, date: r.created_at })),
  behavioral_patterns: {
    task_completion_style: tasks.map(t => ({ 
      title: t.title, 
      priority: t.priority, 
      completed: t.completed, 
      created: t.created_at,
      due_date: t.due_date 
    })),
    habit_consistency: habits.map(h => ({ 
      title: h.title, 
      frequency: h.frequency, 
      streak: h.streak, 
      category: h.category 
    })),
    goal_patterns: goals.map(g => ({ 
      title: g.title, 
      category: g.category, 
      progress: g.progress, 
      completed: g.completed 
    })),
    emotional_journal: journal.map(j => ({ 
      mood: j.mood, 
      content_length: j.content?.length || 0, 
      tags: j.tags, 
      date: j.created_at 
    })),
    focus_behavior: focus.map(f => ({ 
      duration: f.duration, 
      completed: !!f.completed_at, 
      date: f.created_at 
    })),
    habit_completion_patterns: completions.map(c => ({ 
      date: c.completed_date, 
      consistency: true 
    }))
  }
})}`,
          user_id: user.id,
          context: {
            analysis_mode: 'personality_profile',
            depth: 'comprehensive'
          }
        }
      });

      if (error) throw error;

      let parsedProfile: PersonalityProfile;
      try {
        if (typeof data?.response === 'string') {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedProfile = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } else {
            parsedProfile = JSON.parse(data.response);
          }
        } else {
          parsedProfile = data?.response || data;
        }
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de générer le profil, réessayez dans quelques instants.');
      }

      setProfile(parsedProfile);
      setLastGenerated(new Date().toISOString());
      toast.success('Profil psychologique généré !');

    } catch (error) {
      console.error('Error generating personality profile:', error);
      toast.error('Erreur lors de la génération du profil');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-génération si pas de profil existant
    if (user && !profile && !isLoading) {
      generateProfile();
    }
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p>Connectez-vous pour voir votre profil psychologique</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Analyse psychologique en cours...</h3>
            <p className="text-muted-foreground">
              L'IA analyse vos réflexions, habitudes, tâches et journalisation pour créer votre profil personnalisé
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profil psychologique</h3>
            <p className="text-muted-foreground mb-4">
              Découvrez votre personnalité unique basée sur vos données
            </p>
            <Button onClick={generateProfile}>
              <Brain className="h-4 w-4 mr-2" />
              Générer mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Profil Psychologique
          </h1>
          <p className="text-muted-foreground">Analyse approfondie de votre personnalité par l'IA</p>
          {lastGenerated && (
            <p className="text-xs text-muted-foreground mt-1">
              Dernière analyse : {new Date(lastGenerated).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
        <Button onClick={generateProfile} disabled={isLoading} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </motion.div>

      {/* Scores psychologiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Scores Psychologiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Santé Mentale</span>
                  <span className={`text-sm font-bold ${getScoreColor(profile.mentalHealthScore)}`}>
                    {profile.mentalHealthScore}%
                  </span>
                </div>
                <Progress value={profile.mentalHealthScore} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Adaptabilité</span>
                  <span className={`text-sm font-bold ${getScoreColor(profile.adaptabilityIndex)}`}>
                    {profile.adaptabilityIndex}%
                  </span>
                </div>
                <Progress value={profile.adaptabilityIndex} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Résilience</span>
                  <span className={`text-sm font-bold ${getScoreColor(profile.resilienceLevel)}`}>
                    {profile.resilienceLevel}%
                  </span>
                </div>
                <Progress value={profile.resilienceLevel} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Créativité</span>
                  <span className={`text-sm font-bold ${getScoreColor(profile.creativityIndex)}`}>
                    {profile.creativityIndex}%
                  </span>
                </div>
                <Progress value={profile.creativityIndex} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Engagement Social</span>
                  <span className={`text-sm font-bold ${getScoreColor(profile.socialEngagement)}`}>
                    {profile.socialEngagement}%
                  </span>
                </div>
                <Progress value={profile.socialEngagement} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil de personnalité */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Type de Personnalité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary mb-2">{profile.personalityType}</h3>
                <p className="text-sm text-muted-foreground">{profile.emotionalProfile}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Traits Principaux :</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.coreTraits.map((trait, index) => (
                    <Badge key={index} variant="secondary">{trait}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Style de Travail :</h4>
                <p className="text-sm">{profile.workingStyle}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Motivation :</h4>
                <p className="text-sm">{profile.motivationStyle}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Forces et croissance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Forces & Croissance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-green-600">💪 Forces :</h4>
                <ul className="space-y-1">
                  {profile.strengthsAnalysis.map((strength, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">🎯 Domaines de Croissance :</h4>
                <ul className="space-y-1">
                  {profile.growthAreas.map((area, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">⚠️ Patterns de Stress :</h4>
                <ul className="space-y-1">
                  {profile.stressPatterns.map((pattern, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights psychologiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Insights Psychologiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.psychologicalInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommandations et chemin de développement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Recommandations Personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.personalizedRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-400">
                    <p className="text-sm font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Chemin de Développement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-400">
                <p className="text-sm leading-relaxed">{profile.progressionPath}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
