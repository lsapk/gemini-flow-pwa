
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw, TrendingUp, Target, Timer, BookOpen, Brain, Lightbulb } from "lucide-react";
import { SimpleAreaChart, SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/components/ui/custom-charts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useRealProductivityAnalysis } from "@/hooks/useRealProductivityAnalysis";
import { InsightCard } from "@/components/ui/InsightCard";
import { useAIProductivityInsights } from "@/hooks/useAIProductivityInsights";
import { motion } from "framer-motion";

export default function Analysis() {
  const { habitsData, tasksData, focusData, activityData, isLoading, refetch } = useAnalyticsData();
  const { data: productivityData, isLoading: productivityLoading } = useRealProductivityAnalysis();

  // Extract productivity scores from the data with defaults
  const {
    score = 0,
    completionRate = 0,
    focusTimeScore = 0,
    consistencyScore = 0,
    qualityScore = 0,
    timeManagementScore = 0,
    journalScore = 0,
    goalScore = 0,
    insights = [],
    recommendations = []
  } = productivityData || {};

  const { insights: aiInsights, isLoading: insightsLoading } = useAIProductivityInsights();

  if (isLoading || productivityLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement de l'analyse approfondie...</p>
        </div>
      </div>
    );
  }

  const breakdown = {
    tasks: Math.round(completionRate),
    habits: Math.round(consistencyScore),
    goals: Math.round(qualityScore),
    focus: Math.round(focusTimeScore),
    timeManagement: Math.round(timeManagementScore),
    journal: Math.round(journalScore),
    goalScore: Math.round(goalScore)
  };

  // Prepare chart data with real data
  const tasksChartData = tasksData && tasksData.length > 0 ? tasksData.map(task => ({
    name: task.name,
    completed: task.completed || 0,
    pending: task.pending || 0,
    total: (task.completed || 0) + (task.pending || 0)
  })) : [
    { name: 'Lun', completed: 3, pending: 2, total: 5 },
    { name: 'Mar', completed: 5, pending: 3, total: 8 },
    { name: 'Mer', completed: 4, pending: 2, total: 6 },
    { name: 'Jeu', completed: 7, pending: 3, total: 10 },
    { name: 'Ven', completed: 5, pending: 2, total: 7 },
    { name: 'Sam', completed: 3, pending: 1, total: 4 },
    { name: 'Dim', completed: 2, pending: 1, total: 3 }
  ];

  const habitsChartData = habitsData && habitsData.length > 0 ? habitsData.map(habit => ({
    name: habit.name || 'Habitude',
    value: habit.value || 0
  })) : [
    { name: 'Lun', value: 3 },
    { name: 'Mar', value: 4 },
    { name: 'Mer', value: 3 },
    { name: 'Jeu', value: 5 },
    { name: 'Ven', value: 4 },
    { name: 'Sam', value: 2 },
    { name: 'Dim', value: 1 }
  ];

  const focusChartData = focusData && focusData.length > 0 ? focusData.map(session => ({
    name: session.date || 'Session',
    value: session.minutes || 0
  })) : [
    { name: 'Lun', value: 120 },
    { name: 'Mar', value: 90 },
    { name: 'Mer', value: 150 },
    { name: 'Jeu', value: 180 },
    { name: 'Ven', value: 100 },
    { name: 'Sam', value: 60 },
    { name: 'Dim', value: 30 }
  ];

  const activityChartData = activityData && activityData.length > 0 ? activityData.map(activity => ({
    name: activity.date || 'Activité',
    value: activity.count || 0
  })) : [
    { name: 'Tâches', value: 40 },
    { name: 'Habitudes', value: 25 },
    { name: 'Focus', value: 20 },
    { name: 'Journal', value: 15 }
  ];

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyse approfondie</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre productivité avec insights IA</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </motion.div>

      {/* Enhanced Productivity Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl">Score de Productivité Global</h2>
                <p className="text-sm text-muted-foreground">Analyse détaillée de vos performances</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Score */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {score}%
                </div>
                <Badge variant="outline" className="mb-4">Score Global</Badge>
                
                {/* Performance Indicators */}
                <div className="space-y-2">
                  {score >= 80 && (
                    <Badge className="bg-green-500 text-white">🏆 Performance Excellente</Badge>
                  )}
                  {score >= 60 && score < 80 && (
                    <Badge className="bg-blue-500 text-white">📈 Bonne Performance</Badge>
                  )}
                  {score >= 40 && score < 60 && (
                    <Badge className="bg-yellow-500 text-white">⚡ En Progression</Badge>
                  )}
                  {score < 40 && (
                    <Badge className="bg-red-500 text-white">🎯 Potentiel d'Amélioration</Badge>
                  )}
                </div>
              </div>
              
              {/* Detailed Breakdown */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg mb-4">Analyse détaillée par domaine</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      <span>Tâches</span>
                    </div>
                    <span className="font-bold text-lg">{breakdown.tasks}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <span>Habitudes</span>
                    </div>
                    <span className="font-bold text-lg">{breakdown.habits}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-orange-500" />
                      <span>Focus</span>
                    </div>
                    <span className="font-bold text-lg">{breakdown.focus}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                      <span>Journal</span>
                    </div>
                    <span className="font-bold text-lg">{breakdown.journal}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights personnalisés */}
      {(insights.length > 0 || recommendations.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Analyse IA Personnalisée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {insights.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Observations clés
                  </h3>
                  <div className="grid gap-2">
                    {insights.map((insight, index) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-400 dark:border-blue-600">
                        <p className="text-sm text-blue-900 dark:text-blue-100">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Recommandations personnalisées
                  </h3>
                  <div className="grid gap-2">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-400 dark:border-green-600">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Insights from separate hook */}
      {(insightsLoading || (aiInsights && aiInsights.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Conseils personnalisés générés par l'IA
            </h2>
            {insightsLoading ? (
              <Card className="p-8">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">L'IA analyse vos données pour générer des conseils personnalisés...</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {aiInsights.map(insight => (
                  <InsightCard
                    key={insight.id}
                    title={insight.title}
                    insight={insight.insight}
                    recommendation={insight.recommendation}
                    priority={insight.priority}
                    icon={BarChart3}
                    metric={insight.metric}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Tâches</CardTitle>
              <p className="text-sm text-muted-foreground">
                {tasksData && tasksData.length > 0 ? 'Données en temps réel' : 'Données de démonstration'}
              </p>
            </CardHeader>
            <CardContent>
              <SimpleLineChart 
                data={tasksChartData} 
                lines={[
                  { dataKey: "completed", name: "Complétées", color: "#10B981" },
                  { dataKey: "pending", name: "En cours", color: "#F59E0B" },
                  { dataKey: "total", name: "Total", color: "#7C3AED" }
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance des Habitudes</CardTitle>
              <p className="text-sm text-muted-foreground">
                {habitsData && habitsData.length > 0 ? 'Données en temps réel' : 'Données de démonstration'}
              </p>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={habitsChartData} color="#10B981" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions de Focus</CardTitle>
              <p className="text-sm text-muted-foreground">
                {focusData && focusData.length > 0 ? 'Données en temps réel (minutes)' : 'Données de démonstration'}
              </p>
            </CardHeader>
            <CardContent>
              <SimpleAreaChart data={focusChartData} color="#3B82F6" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition des Activités</CardTitle>
              <p className="text-sm text-muted-foreground">
                {activityData && activityData.length > 0 ? 'Données en temps réel' : 'Données de démonstration'}
              </p>
            </CardHeader>
            <CardContent>
              <SimplePieChart data={activityChartData} />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Data Status Indicator */}
      {(!tasksData || tasksData.length === 0) && (!habitsData || habitsData.length === 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              📊 Les graphiques affichent des données de démonstration. Commencez à utiliser l'application (créez des tâches, habitudes, sessions de focus) pour voir vos vraies données d'analyse.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
