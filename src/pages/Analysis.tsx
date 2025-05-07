
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
import { Bot, User, LineChart, BarChart3, PieChart, TrendingUp, AlertCircle, Loader2, WifiOff, Wifi, SendHorizonal, Maximize2, Minimize2 } from 'lucide-react';
import { ChartData } from '@/components/ui/charts/types';
import { useAuth } from '@/hooks/useAuth';
import { Markdown } from '@/components/Markdown';
import { supabase } from '@/integrations/supabase/client';
import { checkAIRequestLimit, MAX_FREEMIUM_REQUESTS_PER_DAY, trackAIRequest } from '@/utils/aiLimits';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useMobile } from '@/hooks/use-mobile';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useMobile();
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });
  const [customMessages, setCustomMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get real analytics data
  const { 
    habitsData, 
    tasksData, 
    focusData, 
    activityData, 
    taskCompletionRate, 
    totalFocusTime,
    streakCount,
    isLoading: isDataLoading, 
    error: dataError,
    refetch
  } = useAnalyticsData();

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

  // Auto fullscreen on mobile
  useEffect(() => {
    if (isMobile && selectedTab === "custom") {
      setIsFullscreen(true);
    }
  }, [isMobile, selectedTab]);

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

  // Convert task data for pie chart
  const taskCompletionData = React.useMemo(() => {
    if (!tasksData || tasksData.length === 0 || tasksData[0].name === "Pas de données") {
      return [
        { name: 'Complétées', value: 0 },
        { name: 'En cours', value: 0 },
        { name: 'En retard', value: 0 },
      ];
    }
    
    let completed = 0;
    let pending = 0;
    let late = 0;
    
    tasksData.forEach((item) => {
      completed += item.completed || 0;
      pending += item.pending || 0;
    });
    
    // Simple estimation for late tasks (10% of pending)
    if (pending > 0) {
      late = Math.round(pending * 0.1);
      pending -= late;
    }
    
    return [
      { name: 'Complétées', value: completed },
      { name: 'En cours', value: pending },
      { name: 'En retard', value: late }
    ];
  }, [tasksData]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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

  return (
    <div className={`space-y-8 pb-16 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : ''}`}>
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LineChart className="h-8 w-8" />
            Analyse IA
          </h1>
          <p className="text-muted-foreground">
            Obtenez des insights sur vos habitudes, tâches et objectifs grâce à l'intelligence artificielle.
          </p>
        </div>
        
        {selectedTab === "custom" && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="flex-shrink-0"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
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
          {isDataLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : dataError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de chargement</AlertTitle>
              <AlertDescription>
                {dataError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => refetch()}
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">Productivité</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <SimpleAreaChart data={activityData} xAxisKey="date" areaKey="count" />
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
                    <SimplePieChart 
                      data={taskCompletionData} 
                      colors={["#9b87f5", "#f5a787", "#87f5a7"]} 
                    />
                  </div>
                  <div className="text-center text-sm mt-4 text-muted-foreground">
                    Taux de complétion: {taskCompletionRate.toFixed(0)}%
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
                  <div className="text-center text-sm mt-4 text-muted-foreground">
                    Meilleure série: {streakCount} jours
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">Sessions Focus</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <SimpleLineChart data={focusData} xAxisKey="date" lines={[{ dataKey: "minutes", name: "Minutes", color: "#9b87f5" }]} />
                  </div>
                  <div className="text-center text-sm mt-4 text-muted-foreground">
                    Total: {(totalFocusTime / 60).toFixed(1)} heures de concentration
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          <div className="grid gap-6 md:grid-cols-1">
            <Card className={isFullscreen ? "h-full" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Analyse IA Personnalisée</CardTitle>
                  {!isMobile && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Posez n'importe quelle question sur vos habitudes, tâches et objectifs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Conversation avec l'assistant d'analyse personnalisée */}
                  <div className={`${isFullscreen ? 'h-[calc(100vh-320px)]' : 'h-[400px]'} overflow-y-auto p-2 space-y-4 border rounded-md`}>
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
                  {analysisResult?.charts && Object.keys(analysisResult.charts).length > 0 && (
                    <div className="mt-6 space-y-6">
                      <h3 className="text-lg font-medium">Visualisations des données</h3>
                      <div className="grid gap-6 md:grid-cols-2">
                        {analysisResult.charts.bar && (
                          <Card>
                            <CardHeader className="py-2">
                              <CardTitle className="text-base">Graphique à barres</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[200px]">
                                <SimpleBarChart data={analysisResult.charts.bar} color="#9b87f5" />
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {analysisResult.charts.line && (
                          <Card>
                            <CardHeader className="py-2">
                              <CardTitle className="text-base">Graphique linéaire</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[200px]">
                                <SimpleLineChart 
                                  data={analysisResult.charts.line}
                                  lines={[{ dataKey: "value", name: "Valeur", color: "#9b87f5" }]}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {analysisResult.charts.pie && (
                          <Card>
                            <CardHeader className="py-2">
                              <CardTitle className="text-base">Graphique circulaire</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[200px]">
                                <SimplePieChart 
                                  data={analysisResult.charts.pie} 
                                  colors={["#9b87f5", "#1EAEDB", "#f59e0b", "#ef4444", "#8b5cf6"]}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {analysisResult.charts.area && (
                          <Card>
                            <CardHeader className="py-2">
                              <CardTitle className="text-base">Graphique de zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[200px]">
                                <SimpleAreaChart data={analysisResult.charts.area} color="#9b87f5" />
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
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
      
      {isFullscreen && (
        <Button 
          onClick={toggleFullscreen} 
          className="fixed bottom-4 right-4 z-50"
          variant="secondary"
        >
          <Minimize2 className="h-4 w-4 mr-2" /> Quitter le mode plein écran
        </Button>
      )}
    </div>
  );
};

export default Analysis;
