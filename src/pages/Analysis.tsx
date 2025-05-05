import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SimpleAreaChart, SimpleBarChart, SimplePieChart, SimpleLineChart, AreaChart, BarChart, PieChart, LineChart } from "@/components/ui/custom-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  Loader2, 
  AlertCircle, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Calendar,
  ListChecks,
  Timer,
  Brain,
  Send,
  Sparkles,
  WifiOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAIAnalysis } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkAIRequestLimit, trackAIRequest, MAX_FREEMIUM_REQUESTS_PER_DAY } from "@/utils/aiLimits";
import { getUserSettings } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Analysis = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState<string>("fr");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customAnalysisLoading, setCustomAnalysisLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("week");
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });

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

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Obtenir la préférence de langue de l'utilisateur
        const { data: settings } = await getUserSettings();
        if (settings && settings.language) {
          setLanguage(settings.language);
        }

        // Vérifier si l'utilisateur a atteint la limite de requêtes IA
        const limits = await checkAIRequestLimit("analysis");
        setRequestsInfo(limits);

        if (!limits.isPremium && limits.hasReachedLimit) {
          setAnalysis(`⚠️ **Limite atteinte**\n\nVous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} analyses quotidiennes avec le compte gratuit. Passez à un abonnement premium pour bénéficier d'analyses illimitées.`);
          setLoading(false);
          return;
        }

        if (networkStatus === "offline") {
          setAnalysis(`⚠️ **Mode hors ligne**\n\nL'analyse IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité.`);
          setLoading(false);
          return;
        }

        // Suivre cette requête IA avant d'effectuer l'appel
        if (!limits.hasReachedLimit) {
          await trackAIRequest("analysis");
        }

        const { data, error } = await getAIAnalysis(user.id);

        if (error) {
          throw new Error(error as string);
        }

        if (data) {
          setAnalysis(data.analysis);
          setStats(data.stats);
        }

        // Mettre à jour les limites après une requête réussie
        const newLimits = await checkAIRequestLimit("analysis");
        setRequestsInfo(newLimits);
      } catch (error) {
        console.error("Erreur lors du chargement de l'analyse:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'analyse.",
          variant: "destructive",
        });
        setAnalysis("⚠️ **Une erreur est survenue**\n\nImpossible de générer l'analyse en ce moment. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast, networkStatus]);

  const handleRefresh = async () => {
    if (!user) return;
    if (networkStatus === "offline") {
      toast({
        title: "Mode Hors Ligne",
        description: "L'analyse IA n'est pas disponible en mode hors ligne.",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    try {
      // Vérifier si l'utilisateur a atteint la limite de requêtes IA
      const limits = await checkAIRequestLimit("analysis");
      setRequestsInfo(limits);

      if (!limits.isPremium && limits.hasReachedLimit) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} analyses quotidiennes. Passez à un abonnement premium pour un accès illimité.`,
          variant: "destructive",
        });
        setRefreshing(false);
        return;
      }

      // Suivre cette requête IA avant d'effectuer l'appel
      await trackAIRequest("analysis");

      const { data, error } = await getAIAnalysis(user.id);

      if (error) {
        throw new Error(error as string);
      }

      if (data) {
        setAnalysis(data.analysis);
        setStats(data.stats);
      }

      // Mettre à jour les limites après une requête réussie
      const newLimits = await checkAIRequestLimit("analysis");
      setRequestsInfo(newLimits);

      toast({
        title: "Analyse mise à jour",
        description: "L'analyse a été actualisée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l'actualisation de l'analyse:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser l'analyse.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCustomAnalysis = async () => {
    if (!customPrompt.trim() || !user) return;
    if (networkStatus === "offline") {
      toast({
        title: "Mode Hors Ligne",
        description: "L'analyse IA personnalisée n'est pas disponible en mode hors ligne.",
        variant: "destructive",
      });
      return;
    }

    setCustomAnalysisLoading(true);
    try {
      // Vérifier si l'utilisateur a atteint la limite de requêtes IA
      const limits = await checkAIRequestLimit("analysis");
      
      if (!limits.isPremium && limits.hasReachedLimit) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} analyses quotidiennes. Passez à un abonnement premium pour un accès illimité.`,
          variant: "destructive",
        });
        setCustomAnalysisLoading(false);
        return;
      }

      // Suivre cette requête IA avant d'effectuer l'appel
      await trackAIRequest("analysis");

      // Ici vous appelleriez idéalement une fonction d'analyse personnalisée
      // Pour l'instant, nous utilisons la même fonction mais vous pourriez ajouter le paramètre customPrompt
      const { data, error } = await getAIAnalysis(user.id);

      if (error) {
        throw new Error(error as string);
      }

      if (data) {
        // Simuler une analyse personnalisée en ajoutant un préfixe
        setAnalysis(`💡 **Analyse personnalisée :** "${customPrompt}"\n\n${data.analysis}`);
        setCustomPrompt("");
      }

      // Mettre à jour les limites après une requête réussie
      const newLimits = await checkAIRequestLimit("analysis");
      setRequestsInfo(newLimits);

      toast({
        title: "Analyse personnalisée",
        description: "Votre analyse personnalisée a été générée.",
      });
    } catch (error) {
      console.error("Erreur lors de la génération de l'analyse personnalisée:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'analyse personnalisée.",
        variant: "destructive",
      });
    } finally {
      setCustomAnalysisLoading(false);
    }
  };

  // Données statistiques pour les cartes d'informations
  const getStatCards = () => {
    // Données par défaut si stats n'est pas disponible
    const defaultStats = {
      totalTasks: 0,
      completedTasks: 0,
      totalHabits: 0,
      streakHabits: 0,
      focusTime: 0,
      focusSessions: 0
    };

    // Extraire des statistiques à partir des données
    const extractedStats = {
      totalTasks: 0,
      completedTasks: 0,
      totalHabits: 0,
      streakHabits: 0,
      focusTime: 0,
      focusSessions: 0
    };

    if (stats) {
      // Calculer les statistiques à partir des données de graphiques
      if (stats.tasksPerDay) {
        extractedStats.totalTasks = stats.tasksPerDay.reduce((acc: number, day: any) => acc + day.total, 0);
        extractedStats.completedTasks = Math.round(extractedStats.totalTasks * 0.7); // Simuler 70% de tâches complétées
      }
      
      if (stats.habitsPerWeek) {
        extractedStats.totalHabits = stats.habitsPerWeek.reduce((acc: number, week: any) => acc + week.total, 0);
        extractedStats.streakHabits = Math.round(extractedStats.totalHabits * 0.5); // Simuler 50% d'habitudes avec streak
      }
      
      if (stats.focusPerDay) {
        extractedStats.focusTime = stats.focusPerDay.reduce((acc: number, day: any) => acc + day.total, 0);
        extractedStats.focusSessions = Math.ceil(extractedStats.focusTime / 30); // Estimer les sessions (moyenne 30min)
      }
    }

    const finalStats = stats ? extractedStats : defaultStats;

    return [
      {
        title: "Tâches complétées",
        value: finalStats.completedTasks,
        total: finalStats.totalTasks,
        change: "+5%",
        trend: "up",
        icon: <ListChecks className="h-4 w-4" />
      },
      {
        title: "Habitudes suivies",
        value: finalStats.streakHabits,
        total: finalStats.totalHabits,
        change: "+3%",
        trend: "up",
        icon: <Calendar className="h-4 w-4" />
      },
      {
        title: "Minutes de focus",
        value: finalStats.focusTime,
        total: 500, // Objectif hebdomadaire arbitraire
        change: "-2%",
        trend: "down",
        icon: <Timer className="h-4 w-4" />
      },
      {
        title: "Insights IA",
        value: requestsInfo.requestsToday,
        total: requestsInfo.isPremium ? "∞" : MAX_FREEMIUM_REQUESTS_PER_DAY,
        isPremium: requestsInfo.isPremium,
        icon: <Brain className="h-4 w-4" />
      }
    ];
  };

  // Données supplémentaires pour les graphiques
  const getCategoryData = () => {
    return [
      { name: "Travail", value: 40 },
      { name: "Santé", value: 25 },
      { name: "Personnel", value: 20 },
      { name: "Études", value: 15 }
    ];
  };

  const getProductivityData = () => {
    return [
      { name: "Lun", high: 85, low: 50 },
      { name: "Mar", high: 75, low: 60 },
      { name: "Mer", high: 90, low: 70 },
      { name: "Jeu", high: 65, low: 40 },
      { name: "Ven", high: 80, low: 55 },
      { name: "Sam", high: 60, low: 35 },
      { name: "Dim", high: 50, low: 30 }
    ];
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Analyse
        </h1>
        <p className="text-muted-foreground">
          Suivi et analyse de votre productivité avec insights personnalisés.
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
              ? `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} analyses quotidiennes. Passez à un abonnement premium pour un accès illimité.`
              : `Vous avez utilisé ${requestsInfo.requestsToday}/${MAX_FREEMIUM_REQUESTS_PER_DAY} analyses quotidiennes.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatCards().map((stat, index) => (
          <Card key={index} className="bg-card/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}{typeof stat.total === 'number' ? `/${stat.total}` : ''}
              </div>
              {stat.hasOwnProperty('change') ? (
                <p className={`text-xs flex items-center ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUp className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDown className="mr-1 h-3 w-3" />
                  )}
                  {stat.change} par rapport à la semaine dernière
                </p>
              ) : stat.hasOwnProperty('isPremium') ? (
                <Badge variant="outline" className={stat.isPremium ? "bg-primary/10 text-primary" : ""}>
                  {stat.isPremium ? "Premium illimité" : "Freemium"}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="insights">
        <TabsList className="mb-6">
          <TabsTrigger value="insights" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Graphiques
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1.5">
            <Brain className="h-4 w-4" />
            Analyse personnalisée
          </TabsTrigger>
        </TabsList>

        {/* Onglet Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Analyse IA
                </CardTitle>
                <div className="flex items-center gap-2">
                  {requestsInfo.isPremium ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="outline">{requestsInfo.requestsToday}/{MAX_FREEMIUM_REQUESTS_PER_DAY}</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading || refreshing || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Génération de votre analyse personnalisée...
                    </p>
                  </div>
                </div>
              ) : !user ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p>Veuillez vous connecter pour voir votre analyse personnalisée.</p>
                  <Button className="mt-4" variant="outline">
                    Se connecter
                  </Button>
                </div>
              ) : analysis ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown content={analysis} />
                </div>
              ) : (
                <p>Aucune donnée d'analyse disponible.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Graphiques */}
        <TabsContent value="charts" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Tâches complétées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={stats?.tasksPerDay || [
                    { name: "Lun", total: 2 },
                    { name: "Mar", total: 5 },
                    { name: "Mer", total: 3 },
                    { name: "Jeu", total: 7 },
                    { name: "Ven", total: 4 },
                    { name: "Sam", total: 3 },
                    { name: "Dim", total: 2 },
                  ]}
                  barKey="total"
                  className={loading ? "opacity-50" : ""}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Habitudes suivies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={stats?.habitsPerWeek || [
                    { name: "Semaine 1", total: 12 },
                    { name: "Semaine 2", total: 18 },
                    { name: "Semaine 3", total: 15 },
                    { name: "Semaine 4", total: 20 },
                  ]}
                  areaKey="total"
                  className={loading ? "opacity-50" : ""}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Sessions Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={stats?.focusPerDay || [
                    { name: "Lun", total: 45 },
                    { name: "Mar", total: 60 },
                    { name: "Mer", total: 30 },
                    { name: "Jeu", total: 75 },
                    { name: "Ven", total: 45 },
                    { name: "Sam", total: 15 },
                    { name: "Dim", total: 30 },
                  ]}
                  barKey="total"
                  className={loading ? "opacity-50" : ""}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Répartition par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={getCategoryData()}
                  className={loading ? "opacity-50" : ""}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-primary" />
                Indice de productivité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={getProductivityData()}
                lines={[
                  { dataKey: "high", name: "Énergie", color: "#10b981" },
                  { dataKey: "low", name: "Focus", color: "#0ea5e9" }
                ]}
                className={loading ? "opacity-50" : ""}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analyse personnalisée */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Analyse IA personnalisée
              </CardTitle>
              <div>
                <p className="text-sm text-muted-foreground">
                  Posez une question spécifique à l'IA et obtenez des insights personnalisés sur vos données.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ex: Quels sont mes moments de productivité idéaux dans la journée ? Quelles habitudes devrais-je renforcer ?"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="h-24"
                  disabled={
                    customAnalysisLoading || 
                    networkStatus === "offline" || 
                    (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)
                  }
                />
                <Button 
                  onClick={handleCustomAnalysis}
                  disabled={
                    !customPrompt.trim() || 
                    customAnalysisLoading || 
                    networkStatus === "offline" || 
                    (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)
                  }
                  className="w-full"
                >
                  {customAnalysisLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération de l'analyse...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Générer l'analyse
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 text-xs text-muted-foreground rounded-b-lg">
              Conseil: Essayez de poser des questions spécifiques sur vos habitudes, votre productivité ou vos objectifs.
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;
