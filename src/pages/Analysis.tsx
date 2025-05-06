
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { SimpleAreaChart } from '@/components/ui/charts/SimpleAreaChart';
import { SimpleBarChart } from '@/components/ui/charts/SimpleBarChart';
import { SimpleLineChart } from '@/components/ui/charts/SimpleLineChart';
import { SimplePieChart } from '@/components/ui/charts/SimplePieChart';
import { Bot, User, LineChart, BarChart3, PieChart, TrendingUp, AlertCircle, Loader2, WifiOff, Wifi, SendHorizonal } from 'lucide-react';
import { ChartData } from '@/components/ui/charts/types';
import { useAuth } from '@/hooks/useAuth';
import { Markdown } from '@/components/Markdown';
import { supabase } from '@/integrations/supabase/client';
import { checkAIRequestLimit, MAX_FREEMIUM_REQUESTS_PER_DAY, trackAIRequest } from '@/utils/aiLimits';

interface AnalysisResult {
  content: string;
  charts?: {
    bar?: ChartData[];
    line?: ChartData[];
    pie?: ChartData[];
    area?: ChartData[];
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Fonction pour générer l'analyse IA
async function generateAnalysis(prompt: string, userId: string) {
  const response = await supabase.functions.invoke('gemini-analysis', {
    body: { 
      prompt,
      userId 
    }
  });
  return response;
}

const Analysis = () => {
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedTab, setSelectedTab] = useState("insights");
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });
  const [customMessages, setCustomMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vérification périodique du statut réseau
  useEffect(() => {
    const checkNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? "online" : "offline");
    };

    // Vérifier immédiatement
    checkNetworkStatus();

    // Écouter les changements de statut réseau
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    // Vérifier les limites d'utilisation de l'IA
    const checkLimits = async () => {
      if (user) {
        try {
          const limits = await checkAIRequestLimit("analysis");
          setRequestsInfo(limits);
        } catch (error) {
          console.error("Erreur lors de la vérification des limites d'utilisation de l'IA:", error);
        }
      }
    };

    checkLimits();

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, [user]);

  // Scroll vers le bas quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [customMessages]);

  // Message initial pour l'analyse personnalisée
  useEffect(() => {
    setCustomMessages([
      {
        role: "assistant",
        content: "👋 **Bienvenue dans l'Analyse IA Personnalisée!**\n\nPosez-moi n'importe quelle question sur vos données, votre productivité ou demandez-moi d'analyser des informations spécifiques."
      }
    ]);
  }, []);

  // Fonction pour générer l'analyse IA personnalisée
  const handleCustomAnalysis = async () => {
    if (!customPrompt.trim()) return;
    if (!user) {
      toast({
        title: "Connexion nécessaire",
        description: "Veuillez vous connecter pour utiliser l'analyse IA.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier si l'utilisateur a atteint sa limite
    try {
      const limits = await checkAIRequestLimit("analysis");
      setRequestsInfo(limits);

      if (!limits.isPremium && limits.hasReachedLimit) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes. Passez à un abonnement premium pour un accès illimité.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la limite de requêtes IA:", error);
    }

    // Vérifier l'état du réseau
    if (networkStatus === "offline") {
      toast({
        title: "Mode Hors Ligne",
        description: "L'analyse IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité.",
        variant: "destructive",
      });
      
      setCustomMessages(prev => [
        ...prev,
        { role: "user", content: customPrompt },
        { 
          role: "assistant", 
          content: "⚠️ **Mode hors ligne**\n\nL'analyse IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité." 
        }
      ]);
      
      setCustomPrompt("");
      return;
    }

    const userPrompt = customPrompt;
    setCustomPrompt("");
    
    // Ajouter le message de l'utilisateur au chat
    setCustomMessages(prev => [...prev, { role: "user", content: userPrompt }]);
    setLoading(true);

    try {
      // Suivre cette requête IA
      await trackAIRequest("analysis");
      
      // Générer l'analyse
      const { data, error } = await generateAnalysis(userPrompt, user.id);
      
      if (error) {
        throw new Error(error);
      }

      // Mettre à jour les limites après une requête réussie
      const newLimits = await checkAIRequestLimit("analysis");
      setRequestsInfo(newLimits);

      // Ajouter la réponse à la conversation
      setCustomMessages(prev => [...prev, { role: "assistant", content: data.content }]);
      
      // Stocker aussi le résultat pour les graphiques
      setAnalysisResult(data);
      
      // Automatiquement basculer vers le tab "personnalisé" s'il ne l'est pas déjà
      if (selectedTab !== "custom") {
        setSelectedTab("custom");
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'analyse:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la génération de l'analyse IA.",
        variant: "destructive",
      });
      setCustomMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "❌ **Désolé, une erreur s'est produite.**\n\nJe n'ai pas pu analyser votre demande. Veuillez réessayer plus tard." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Données pour les graphiques préconfigurés
  const productivityData: ChartData[] = [
    { name: 'Lundi', value: 65 },
    { name: 'Mardi', value: 78 },
    { name: 'Mercredi', value: 52 },
    { name: 'Jeudi', value: 84 },
    { name: 'Vendredi', value: 90 },
    { name: 'Samedi', value: 45 },
    { name: 'Dimanche', value: 32 },
  ];

  const taskCompletionData: ChartData[] = [
    { name: 'Complétées', value: 72 },
    { name: 'En cours', value: 18 },
    { name: 'En retard', value: 10 },
  ];

  const habitsData: ChartData[] = [
    { name: 'Méditation', value: 85 },
    { name: 'Exercice', value: 65 },
    { name: 'Lecture', value: 72 },
    { name: 'Journaling', value: 92 },
  ];

  const progressData: ChartData[] = [
    { name: 'Semaine 1', value: 25 },
    { name: 'Semaine 2', value: 40 },
    { name: 'Semaine 3', value: 55 },
    { name: 'Semaine 4', value: 75 },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LineChart className="h-8 w-8" />
          Analyse IA
        </h1>
        <p className="text-muted-foreground">
          Obtenez des insights sur vos habitudes, tâches et objectifs grâce à l'intelligence artificielle.
        </p>
      </div>

      {networkStatus === "offline" && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Mode hors ligne</AlertTitle>
          <AlertDescription>
            L'analyse IA n'est pas disponible en mode hors ligne. Certaines fonctionnalités sont limitées.
          </AlertDescription>
        </Alert>
      )}

      {networkStatus === "online" && !requestsInfo.isPremium && (
        <Alert variant={requestsInfo.hasReachedLimit ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compte Freemium</AlertTitle>
          <AlertDescription>
            {requestsInfo.hasReachedLimit
              ? `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes. Passez à un abonnement premium pour un accès illimité.`
              : `Vous avez utilisé ${requestsInfo.requestsToday}/${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes.`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="insights" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="insights" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center">
            <Bot className="mr-2 h-4 w-4" />
            <span>Analyse IA Personnalisée</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Productivité</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <SimpleAreaChart data={productivityData} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Complétion des tâches</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <SimplePieChart data={taskCompletionData} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Habitudes</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <SimpleBarChart data={habitsData} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Progrès</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <SimpleLineChart data={progressData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Analyse IA Personnalisée</CardTitle>
                <CardDescription>
                  Posez n'importe quelle question sur vos habitudes, tâches et objectifs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Conversation avec l'assistant d'analyse personnalisée */}
                  <div className="h-[400px] overflow-y-auto p-2 space-y-4 border rounded-md">
                    {customMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-start gap-3 max-w-[80%] ${
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`rounded-full p-2 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <Markdown content={msg.content} />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <div className="rounded-full p-2 bg-muted">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <p>Analyse en cours...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input pour l'analyse personnalisée */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Posez votre question ici..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCustomAnalysis();
                        }
                      }}
                      className="min-h-[60px]"
                      disabled={loading || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
                    />
                    <Button
                      onClick={handleCustomAnalysis}
                      disabled={!customPrompt.trim() || loading || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendHorizonal className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Affichage des graphiques si présents */}
                  {analysisResult?.charts && (
                    <div className="mt-6 space-y-6">
                      {analysisResult.charts.bar && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Graphique à barres</h3>
                          <div className="h-[250px]">
                            <SimpleBarChart data={analysisResult.charts.bar} />
                          </div>
                        </div>
                      )}
                      {analysisResult.charts.line && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Graphique linéaire</h3>
                          <div className="h-[250px]">
                            <SimpleLineChart data={analysisResult.charts.line} />
                          </div>
                        </div>
                      )}
                      {analysisResult.charts.pie && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Graphique circulaire</h3>
                          <div className="h-[250px]">
                            <SimplePieChart data={analysisResult.charts.pie} />
                          </div>
                        </div>
                      )}
                      {analysisResult.charts.area && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Graphique de zone</h3>
                          <div className="h-[250px]">
                            <SimpleAreaChart data={analysisResult.charts.area} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {requestsInfo.isPremium ? (
                    <Badge variant="outline" className="mt-2">Premium</Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      {requestsInfo.requestsToday}/{MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes aujourd'hui
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;
