import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  SimpleAreaChart, 
  SimpleBarChart, 
  SimplePieChart, 
  SimpleLineChart,
  ChartLoading
} from "@/components/ui/custom-charts";
import { BrainCircuitIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { ChartData } from "@/components/ui/custom-charts";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/Markdown";
import { checkAIRequestLimit, trackAIRequest, MAX_FREEMIUM_REQUESTS_PER_DAY } from "@/utils/aiLimits";

const Analysis = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [tasksPerDay, setTasksPerDay] = useState<ChartData[]>([]);
  const [habitsPerWeek, setHabitsPerWeek] = useState<ChartData[]>([]);
  const [focusPerDay, setFocusPerDay] = useState<ChartData[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });

  const fetchAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { hasReachedLimit, isPremium } = await checkAIRequestLimit("analysis");
      setRequestsInfo({ hasReachedLimit, requestsToday: 0, isPremium });

      if (!isPremium && hasReachedLimit) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes. Passez à un abonnement premium pour un accès illimité.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await trackAIRequest("analysis");

      const response = await fetch("/api/generate-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id, customPrompt: customPrompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setAnalysis(result.analysis);
      setTasksPerDay(result.stats?.tasksPerDay || []);
      setHabitsPerWeek(result.stats?.habitsPerWeek || []);
      setFocusPerDay(result.stats?.focusPerDay || []);
    } catch (error: any) {
      console.error("Erreur lors de la génération de l'analyse:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la génération de l'analyse.",
        variant: "destructive",
      });
      setAnalysis("⚠️ **Une erreur est survenue**\n\nImpossible de générer l'analyse pour le moment. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    await fetchAnalysis();
  };

  useEffect(() => {
    if (user) {
      fetchAnalysis();
    }
  }, [user]);

  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BrainCircuitIcon className="h-8 w-8" />
          Analyse IA
        </h1>
        <p className="text-muted-foreground">
          Obtenez une analyse approfondie de votre productivité et de votre bien-être.
        </p>
      </div>

      {!requestsInfo.isPremium && requestsInfo.hasReachedLimit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compte Freemium</AlertTitle>
          <AlertDescription>
            Vous avez atteint votre limite de {MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes. Passez à un abonnement premium pour un accès illimité.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <CardTitle className="text-lg font-medium">Analyse Personnalisée</CardTitle>
          <Badge variant="secondary">
            {requestsInfo.isPremium ? "Premium" : `${requestsInfo.requestsToday}/${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes`}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <Textarea
              placeholder="Entrez une requête personnalisée pour l'analyse (optionnel)..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <Button onClick={handleGenerateAnalysis} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                "Générer l'analyse"
              )}
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Rapport d'Analyse</h2>
            {analysis ? (
              <Markdown content={analysis} />
            ) : (
              <div className="flex items-center justify-center">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  "Aucune analyse générée. Entrez une requête personnalisée ou générez une analyse standard."
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="habits">Habitudes</TabsTrigger>
          <TabsTrigger value="focus">Focus</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-2">
          <h2 className="text-xl font-semibold">Tâches par jour</h2>
          {tasksPerDay.length > 0 ? (
            <SimpleBarChart data={tasksPerDay} dataKey="total" xAxisDataKey="name" />
          ) : (
            <ChartLoading />
          )}
        </TabsContent>
        <TabsContent value="habits" className="space-y-2">
          <h2 className="text-xl font-semibold">Habitudes par semaine</h2>
          {habitsPerWeek.length > 0 ? (
            <SimpleLineChart data={habitsPerWeek} dataKey="total" xAxisDataKey="name" />
          ) : (
            <ChartLoading />
          )}
        </TabsContent>
        <TabsContent value="focus" className="space-y-2">
          <h2 className="text-xl font-semibold">Temps de focus par jour</h2>
          {focusPerDay.length > 0 ? (
            <SimpleAreaChart data={focusPerDay} dataKey="total" xAxisDataKey="name" />
          ) : (
            <ChartLoading />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;
