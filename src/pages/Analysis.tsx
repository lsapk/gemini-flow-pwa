
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChartLineIcon, ListTodoIcon, CalendarCheckIcon } from "@/components/icons/DeepFlowIcons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getAIAnalysis } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

const Analysis = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalysis();
    }
  }, [isAuthenticated]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAIAnalysis();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setAnalysis(data.analysis);
      setStats(data.statistics);
      
    } catch (error) {
      console.error("Error fetching analysis:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer l'analyse. Veuillez réessayer."
      });
    } finally {
      setLoading(false);
    }
  };

  // Colors for charts
  const COLORS = ['#6077f5', '#7E69AB', '#a5bffd', '#1EAEDB'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ChartLineIcon className="h-8 w-8" />
            Analyse IA
          </h1>
          <p className="text-muted-foreground">
            Obtenez des insights et des recommandations personnalisées basées sur vos données.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchAnalysis} 
          disabled={loading || !isAuthenticated}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!isAuthenticated ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à vos analyses personnalisées.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Insights personnalisés</CardTitle>
              <CardDescription>
                L'IA analyse vos habitudes et performances pour vous aider à vous améliorer.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <p>Génération de votre analyse en cours...</p>
                </div>
              ) : analysis ? (
                <div className="whitespace-pre-line">{analysis}</div>
              ) : (
                <div className="text-center py-8">
                  <p>Commencez à utiliser DeepFlow pour obtenir des analyses personnalisées.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {stats && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold">Statistiques et Graphiques</h2>
              
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tasks" className="flex items-center gap-1">
                    <ListTodoIcon className="h-4 w-4" /> 
                    Tâches
                  </TabsTrigger>
                  <TabsTrigger value="habits" className="flex items-center gap-1">
                    <CalendarCheckIcon className="h-4 w-4" /> 
                    Habitudes
                  </TabsTrigger>
                  <TabsTrigger value="productivity" className="flex items-center gap-1">
                    <ChartLineIcon className="h-4 w-4" /> 
                    Productivité
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="pt-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Complétion des tâches (par jour)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.taskCompletion}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar name="Tâches terminées" dataKey="completed" fill="#6077f5" />
                          <Bar name="Tâches totales" dataKey="total" fill="#a5bffd" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="habits" className="pt-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Consistance des habitudes (%)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.habitConsistency}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="completion"
                            nameKey="name"
                          >
                            {stats.habitConsistency.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="productivity" className="pt-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Productivité par horaire</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.productivityByHour}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            name="Productivité" 
                            stroke="#6077f5" 
                            strokeWidth={2}
                            dot={{ stroke: '#6077f5', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analysis;
