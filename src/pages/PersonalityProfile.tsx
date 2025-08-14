
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Brain, 
  Heart, 
  Target, 
  TrendingUp, 
  Lightbulb,
  Shield,
  Zap,
  RefreshCw,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface PersonalityProfile {
  personalityType: string;
  personalityDescription: string;
  keyTraits: string[];
  emotionalProfile: {
    dominantEmotion: string;
    emotionalStability: number;
    empathyLevel: number;
    stressResponse: string;
  };
  behavioralPatterns: {
    decisionMaking: string;
    communicationStyle: string;
    conflictResolution: string;
    learningStyle: string;
  };
  psychologicalScores: {
    mentalHealth: number;
    adaptability: number;
    resilience: number;
    creativity: number;
    socialConnection: number;
  };
  developmentRecommendations: string[];
  personalGrowthPlan: {
    shortTerm: string[];
    longTerm: string[];
    dailyPractices: string[];
  };
  insights: string[];
  warnings: string[];
}

export default function PersonalityProfile() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const generateProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log("Génération du profil psychologique...");
      
      // Collecte de TOUTES les données utilisateur
      const [
        tasksResult,
        habitsResult,
        goalsResult,
        journalResult,
        focusResult,
        completionsResult,
        reflectionsResult
      ] = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
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

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `ANALYSE PSYCHOLOGIQUE APPROFONDIE - Créer un profil de personnalité complet

Tu es un psychologue expert spécialisé dans l'analyse comportementale et la psychologie positive. Analyse ces données utilisateur complètes pour créer un profil psychologique détaillé et bienveillant.

DONNÉES UTILISATEUR COMPLÈTES:
${JSON.stringify(completeUserData, null, 2)}

RETOURNE UNIQUEMENT un objet JSON avec cette structure exacte:
{
  "personalityType": "Type de personnalité identifié (ex: Organisateur Créatif, Perfectionniste Empathique, etc.)",
  "personalityDescription": "Description détaillée de 2-3 phrases du type de personnalité",
  "keyTraits": ["array_5_traits_principaux"],
  "emotionalProfile": {
    "dominantEmotion": "Émotion dominante identifiée",
    "emotionalStability": nombre_0_à_100,
    "empathyLevel": nombre_0_à_100,
    "stressResponse": "Comment la personne gère le stress"
  },
  "behavioralPatterns": {
    "decisionMaking": "Style de prise de décision",
    "communicationStyle": "Style de communication préféré",
    "conflictResolution": "Approche de résolution de conflits",
    "learningStyle": "Style d'apprentissage préféré"
  },
  "psychologicalScores": {
    "mentalHealth": nombre_0_à_100,
    "adaptability": nombre_0_à_100,
    "resilience": nombre_0_à_100,
    "creativity": nombre_0_à_100,
    "socialConnection": nombre_0_à_100
  },
  "developmentRecommendations": ["array_5_recommandations_développement_personnel"],
  "personalGrowthPlan": {
    "shortTerm": ["array_3_objectifs_court_terme"],
    "longTerm": ["array_3_objectifs_long_terme"],
    "dailyPractices": ["array_3_pratiques_quotidiennes"]
  },
  "insights": ["array_5_insights_psychologiques_profonds"],
  "warnings": ["array_points_attention_bienveillants"]
}

PRINCIPES DIRECTEURS:
1. BIENVEILLANCE ABSOLUE - Toujours positif et constructif
2. BASÉ SUR LES DONNÉES - Analyse uniquement ce qui est observable
3. ACTIONNABLE - Conseils pratiques et réalisables
4. RESPECTUEUX - Pas de jugements, que des observations
5. SCIENTIFIQUE - Basé sur la psychologie comportementale

ANALYSE À EFFECTUER:
- Patterns de comportement dans les tâches
- Consistance et flexibilité dans les habitudes
- Expressions émotionnelles dans le journal
- Profondeur des réflexions personnelles
- Relation avec les objectifs et l'accomplissement
- Patterns temporels d'activité
- Résilience face aux obstacles
- Style de gestion personnelle

ÉVITER ABSOLUMENT:
- Diagnostics médicaux
- Jugements négatifs
- Généralisations excessives
- Conseils non sollicités sur la santé mentale
- Comparaisons avec d'autres personnes

FOCUS SUR:
- Les forces et potentiels
- Les patterns positifs
- Les opportunités de croissance
- L'auto-compassion
- Le développement personnel`,
          user_id: user.id,
          context: {
            analysis_mode: true,
            psychology_analysis: true,
            user_data: completeUserData
          }
        }
      });

      if (error) throw error;

      // Parse de la réponse IA
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
        console.error('Erreur parsing profil psychologique:', parseError);
        // Profil de fallback basique mais bienveillant
        parsedProfile = {
          personalityType: "Explorateur Personnel",
          personalityDescription: "Vous êtes une personne en quête de développement personnel et d'amélioration continue. Votre utilisation de cet outil montre votre engagement vers une vie plus organisée et épanouie.",
          keyTraits: ["Motivation", "Curiosité", "Engagement", "Potentiel", "Ouverture"],
          emotionalProfile: {
            dominantEmotion: "Optimisme",
            emotionalStability: 70,
            empathyLevel: 75,
            stressResponse: "Recherche d'outils et de solutions"
          },
          behavioralPatterns: {
            decisionMaking: "Réfléchi et méthodique",
            communicationStyle: "Ouvert et direct",
            conflictResolution: "Recherche de solutions constructives",
            learningStyle: "Pratique et expérientiel"
          },
          psychologicalScores: {
            mentalHealth: 75,
            adaptability: 70,
            resilience: 65,
            creativity: 70,
            socialConnection: 65
          },
          developmentRecommendations: [
            "Continuez à explorer de nouveaux outils de développement personnel",
            "Maintenez une routine d'auto-réflexion régulière",
            "Célébrez vos petites victoires quotidiennes",
            "Développez votre réseau de soutien social",
            "Pratiquez la patience avec vous-même"
          ],
          personalGrowthPlan: {
            shortTerm: [
              "Utiliser l'app quotidiennement pendant 2 semaines",
              "Compléter au moins 3 réflexions par semaine",
              "Établir une routine matinale stable"
            ],
            longTerm: [
              "Développer une approche personnalisée de la productivité",
              "Améliorer l'équilibre vie-travail",
              "Cultiver des relations plus profondes"
            ],
            dailyPractices: [
              "5 minutes de réflexion matinale",
              "Noter 3 choses positives par jour",
              "Prendre des pauses conscientes"
            ]
          },
          insights: [
            "Votre engagement dans le développement personnel est admirable",
            "Vous montrez une belle capacité d'introspection",
            "Votre approche méthodique est un atout précieux",
            "Vous avez un bon potentiel d'adaptation",
            "Votre ouverture au changement est remarquable"
          ],
          warnings: [
            "Attention au perfectionnisme excessif",
            "N'oubliez pas de célébrer vos progrès"
          ]
        };
      }

      setProfile(parsedProfile);
      toast.success('Profil psychologique généré avec succès !');

    } catch (error) {
      console.error('Erreur génération profil:', error);
      toast.error('Erreur lors de la génération du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const exportProfile = () => {
    if (!profile) return;
    
    const dataStr = JSON.stringify(profile, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profil-psychologique-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Profil exporté !');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">
          <div className="md:hidden">
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="pt-14 md:pt-6 px-3 md:px-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil Psychologique</h1>
                </div>
                <div className="flex gap-2">
                  {profile && (
                    <Button variant="outline" onClick={exportProfile} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  )}
                  <Button onClick={generateProfile} disabled={isLoading} size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Analyse...' : profile ? 'Régénérer' : 'Générer'}
                  </Button>
                </div>
              </div>

              {!profile && !isLoading && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Découvrez votre profil psychologique</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                      Obtenez une analyse détaillée de votre personnalité basée sur vos habitudes, réflexions, et comportements dans l'app.
                    </p>
                    <Button onClick={generateProfile} size="lg">
                      <Brain className="h-5 w-5 mr-2" />
                      Générer mon profil
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <div className="grid gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-muted rounded mb-4"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {profile && (
                <div className="grid gap-6">
                  {/* Type de personnalité */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Type de Personnalité
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-primary mb-2">{profile.personalityType}</h3>
                        <p className="text-muted-foreground">{profile.personalityDescription}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Traits principaux :</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.keyTraits.map((trait, index) => (
                            <Badge key={index} variant="secondary">{trait}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profil émotionnel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Profil Émotionnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p><strong>Émotion dominante :</strong> {profile.emotionalProfile.dominantEmotion}</p>
                        <p><strong>Réponse au stress :</strong> {profile.emotionalProfile.stressResponse}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Stabilité émotionnelle</span>
                            <span className="text-sm">{profile.emotionalProfile.emotionalStability}%</span>
                          </div>
                          <Progress value={profile.emotionalProfile.emotionalStability} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Niveau d'empathie</span>
                            <span className="text-sm">{profile.emotionalProfile.empathyLevel}%</span>
                          </div>
                          <Progress value={profile.emotionalProfile.empathyLevel} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patterns comportementaux */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Patterns Comportementaux
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Prise de décision :</strong> {profile.behavioralPatterns.decisionMaking}</p>
                          <p><strong>Style de communication :</strong> {profile.behavioralPatterns.communicationStyle}</p>
                        </div>
                        <div>
                          <p><strong>Résolution de conflits :</strong> {profile.behavioralPatterns.conflictResolution}</p>
                          <p><strong>Style d'apprentissage :</strong> {profile.behavioralPatterns.learningStyle}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scores psychologiques */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Scores Psychologiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(profile.psychologicalScores).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm capitalize">
                                {key === 'mentalHealth' ? 'Santé mentale' : 
                                 key === 'adaptability' ? 'Adaptabilité' :
                                 key === 'resilience' ? 'Résilience' :
                                 key === 'creativity' ? 'Créativité' :
                                 key === 'socialConnection' ? 'Connexion sociale' : key}
                              </span>
                              <span className="text-sm">{value}%</span>
                            </div>
                            <Progress value={value} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plan de développement */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Plan de Développement Personnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Objectifs à court terme :</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {profile.personalGrowthPlan.shortTerm.map((goal, index) => (
                            <li key={index} className="text-sm">{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Objectifs à long terme :</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {profile.personalGrowthPlan.longTerm.map((goal, index) => (
                            <li key={index} className="text-sm">{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Pratiques quotidiennes recommandées :</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {profile.personalGrowthPlan.dailyPractices.map((practice, index) => (
                            <li key={index} className="text-sm">{practice}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights et recommandations */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Insights Psychologiques
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {profile.insights.map((insight, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Points d'Attention
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {profile.warnings.map((warning, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <Shield className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommandations de développement */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Recommandations de Développement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {profile.developmentRecommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
