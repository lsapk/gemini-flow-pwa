import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleAreaChart, SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/components/ui/custom-charts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useProductivityScore } from "@/hooks/useProductivityScore";
import { InsightCard } from "@/components/ui/InsightCard";
import { useProductivityInsights } from "@/hooks/useProductivityInsights";

export default function Analysis() {
  const { habitsData, tasksData, focusData, activityData, isLoading, refetch } = useAnalyticsData();
  const { 
    score, 
    completionRate,
    focusTimeScore,
    consistencyScore,
    qualityScore
  } = useProductivityScore();

  const insights = useProductivityInsights();

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement de l'analyse...</p>
        </div>
      </div>
    );
  }

  const breakdown = {
    tasks: Math.round(completionRate),
    habits: Math.round(consistencyScore),
    goals: Math.round(qualityScore),
    focus: Math.round(focusTimeScore)
  };

  // Préparer les données pour les graphiques avec des données réelles
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
      {/* Nouveau bloc : Insights personnalisés */}
      {insights && insights.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <span role="img" aria-label="idées">💡</span>
            Conseils personnalisés
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map(insight => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                insight={insight.insight}
                recommendation={insight.recommendation}
                priority={insight.priority}
                icon={insight.icon}
                metric={insight.metric}
              />
            ))}
          </div>
        </div>
      )}

      {/* Score de productivité avec fond contrastant */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <BarChart3 className="h-6 w-6" />
            Score de Productivité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {score}%
            </div>
            <p className="text-lg text-blue-700 dark:text-blue-300">Score Global</p>
          </div>
          
          {breakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {breakdown.tasks}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tâches</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {breakdown.habits}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Habitudes</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {breakdown.goals}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Objectifs</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {breakdown.focus}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Focus</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphiques d'analyse avec données réelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progression des Tâches</CardTitle>
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
            <CardTitle>Habitudes Complétées</CardTitle>
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

      {/* Indication si données de démo */}
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
