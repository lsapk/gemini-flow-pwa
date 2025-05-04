
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart } from "@/components/ui/custom-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, Loader2, AlertCircle, PieChart, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAIAnalysis } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkAIRequestLimit, trackAIRequest, MAX_FREEMIUM_REQUESTS_PER_DAY } from "@/utils/aiLimits";
import { getUserSettings } from "@/lib/api";

const Analysis = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>("fr");
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's language preference
        const { data: settings } = await getUserSettings();
        if (settings && settings.language) {
          setLanguage(settings.language);
        }

        // Check if user has reached the AI request limit
        const limits = await checkAIRequestLimit("analysis");
        setRequestsInfo(limits);

        if (!limits.isPremium && limits.hasReachedLimit) {
          setAnalysis(`⚠️ **Limite atteinte**\n\nVous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} analyses quotidiennes avec le compte gratuit. Passez à un abonnement premium pour bénéficier d'analyses illimitées.`);
          setLoading(false);
          return;
        }

        // Track this AI request before making the call
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

        // Update limits after successful request
        const newLimits = await checkAIRequestLimit("analysis");
        setRequestsInfo(newLimits);
      } catch (error) {
        console.error("Error fetching analysis:", error);
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
  }, [user, toast]);

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

      {!requestsInfo.isPremium && (
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

      <Tabs defaultValue="insights">
        <TabsList>
          <TabsTrigger value="insights">
            <LineChart className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="h-4 w-4 mr-2" />
            Graphiques
          </TabsTrigger>
        </TabsList>
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Analyse IA</CardTitle>
                {requestsInfo.isPremium ? (
                  <Badge variant="outline">Premium</Badge>
                ) : (
                  <Badge variant="outline">{requestsInfo.requestsToday}/{MAX_FREEMIUM_REQUESTS_PER_DAY}</Badge>
                )}
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
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Tâches complétées</CardTitle>
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
                  tooltipTitle="Tâches"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Habitudes suivies</CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={stats?.habitsPerWeek || [
                    { name: "Semaine 1", total: 12 },
                    { name: "Semaine 2", total: 18 },
                    { name: "Semaine 3", total: 15 },
                    { name: "Semaine 4", total: 20 },
                  ]}
                  tooltipTitle="Habitudes"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sessions Focus</CardTitle>
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
                  tooltipTitle="Minutes"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;
