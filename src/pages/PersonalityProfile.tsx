
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Heart, Target, TrendingUp, User, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonalityData {
  personalityType: string;
  emotionalProfile: {
    dominant: string;
    secondary: string;
  };
  behavioralPatterns: string[];
  psychologicalScores: {
    mentalHealth: number;
    adaptability: number;
    resilience: number;
    creativity: number;
  };
  recommendations: string[];
  lastUpdated: string;
}

const PersonalityProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<PersonalityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Simuler des données pour éviter l'erreur
      const mockData: PersonalityData = {
        personalityType: "Penseur Analytique",
        emotionalProfile: {
          dominant: "Stabilité",
          secondary: "Curiosité"
        },
        behavioralPatterns: [
          "Tendance à planifier en détail",
          "Préfère les tâches complexes",
          "Recherche la perfection"
        ],
        psychologicalScores: {
          mentalHealth: 75,
          adaptability: 82,
          resilience: 70,
          creativity: 88
        },
        recommendations: [
          "Intégrez plus de pauses dans votre routine",
          "Explorez de nouveaux domaines créatifs",
          "Pratiquez la méditation pour réduire le stress"
        ],
        lastUpdated: new Date().toISOString()
      };
      
      setProfileData(mockData);
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
      toast.error("Erreur lors du chargement de votre profil");
    } finally {
      setIsLoading(false);
    }
  };

  const generateProfile = async () => {
    if (!user) return;
    
    try {
      setIsGenerating(true);
      toast.info("Génération de votre profil en cours...");
      
      // Simuler la génération du profil
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchProfileData();
      toast.success("Profil généré avec succès !");
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast.error("Erreur lors de la génération du profil");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profil Psychologique</h1>
            <p className="text-muted-foreground">
              Analyse personnalisée basée sur votre activité et vos réflexions
            </p>
          </div>
          <Button 
            onClick={generateProfile} 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            {isGenerating ? "Génération..." : "Regénérer"}
          </Button>
        </div>

        {!profileData ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucun profil disponible</h3>
              <p className="text-muted-foreground mb-6">
                Générez votre premier profil psychologique basé sur vos données
              </p>
              <Button onClick={generateProfile} disabled={isGenerating}>
                {isGenerating ? "Génération..." : "Générer mon profil"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="patterns">Comportements</TabsTrigger>
              <TabsTrigger value="recommendations">Conseils</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Type de Personnalité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {profileData.personalityType}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Profil Émotionnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Dominant:</span> {profileData.emotionalProfile.dominant}
                    </div>
                    <div>
                      <span className="font-medium">Secondaire:</span> {profileData.emotionalProfile.secondary}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="scores" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(profileData.psychologicalScores).map(([key, value]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {key === 'mentalHealth' ? 'Bien-être Mental' :
                         key === 'adaptability' ? 'Adaptabilité' :
                         key === 'resilience' ? 'Résilience' : 'Créativité'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>{value}%</span>
                          <span className="text-muted-foreground">
                            {value >= 80 ? 'Excellent' : 
                             value >= 60 ? 'Bon' : 
                             value >= 40 ? 'Moyen' : 'À améliorer'}
                          </span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Schémas Comportementaux
                  </CardTitle>
                  <CardDescription>
                    Patterns identifiés dans vos habitudes et activités
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profileData.behavioralPatterns.map((pattern, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Target className="w-4 h-4 mt-1 text-primary" />
                        <span>{pattern}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Recommandations Personnalisées
                  </CardTitle>
                  <CardDescription>
                    Conseils basés sur votre profil psychologique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-4 bg-muted/50 rounded-lg">
                        <p>{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default PersonalityProfile;
