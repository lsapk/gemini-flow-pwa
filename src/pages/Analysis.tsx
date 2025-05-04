
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLineIcon } from "@/components/icons/DeepFlowIcons";
import { useToast } from "@/hooks/use-toast";
import { getAIAnalysis } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import { Markdown } from "@/components/Markdown";

type Stats = {
  tasks: { total: number; completed: number; pending: number };
  habits: { total: number };
  goals: { total: number; completed: number; inProgress: number };
  focus: { sessions: number; totalMinutes: number };
};

const Analysis = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user) {
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour voir vos analyses.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLimitExceeded(false);
        
        const { data, error, status } = await getAIAnalysis(user.id);

        if (status === 429) {
          setLimitExceeded(true);
          setAnalysis(data?.analysis || "Vous avez atteint votre limite quotidienne de requêtes gratuites. Passez à la version premium pour un accès illimité.");
          return;
        }

        if (error) {
          throw new Error(error.message);
        }

        setAnalysis(data?.analysis || "Pas assez de données pour générer une analyse.");
        setStats(data?.stats || null);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre analyse.",
          variant: "destructive",
        });
        console.error("Error fetching analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [user, toast, navigate]);

  // Prepare chart data
  const chartData = stats ? [
    { name: 'Tâches', total: stats.tasks.total, complété: stats.tasks.completed, en_cours: stats.tasks.pending },
    { name: 'Objectifs', total: stats.goals.total, complété: stats.goals.completed, en_cours: stats.goals.inProgress },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ChartLineIcon className="h-8 w-8" />
          Analyse IA
        </h1>
        <p className="text-muted-foreground">
          Des insights personnalisés basés sur vos données et votre activité.
        </p>
      </div>

      {limitExceeded && (
        <Alert variant="warning" className="bg-amber-50 dark:bg-amber-900/30 border-amber-300">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Limite atteinte</AlertTitle>
          <AlertDescription>
            Vous avez atteint votre limite quotidienne de 5 requêtes gratuites. Passez à la version premium pour un accès illimité.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Analyse personnalisée</CardTitle>
            <CardDescription>
              Généré par DeepFlow AI en fonction de votre activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            ) : analysis ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown content={analysis} />
              </div>
            ) : (
              <p>Utilisez davantage l'application pour générer des analyses personnalisées.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
            <CardDescription>
              Aperçu de votre activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tâches</p>
                  <p className="text-2xl font-bold">{stats.tasks.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.tasks.completed} complétées, {stats.tasks.pending} en cours
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Objectifs</p>
                  <p className="text-2xl font-bold">{stats.goals.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.goals.completed} complétés, {stats.goals.inProgress} en cours
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Habitudes</p>
                  <p className="text-2xl font-bold">{stats.habits.total}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sessions Focus</p>
                  <p className="text-2xl font-bold">{stats.focus.sessions}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.focus.totalMinutes} minutes au total
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>
      </div>

      {stats && chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Visualisation des données</CardTitle>
            <CardDescription>
              Progression de vos tâches et objectifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="complété" stackId="a" fill="#4ADE80" />
                  <Bar dataKey="en_cours" stackId="a" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analysis;
