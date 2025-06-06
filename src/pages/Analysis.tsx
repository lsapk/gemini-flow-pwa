
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { SimpleAreaChart, SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/components/ui/custom-charts";
import { useAnalyticsData, useProductivityScore } from "@/hooks/useAnalyticsData";

export default function Analysis() {
  const { habitsData, tasksData, focusData, activityData, isLoading } = useAnalyticsData();
  const { 
    score, 
    isLoading: scoreLoading, 
    completionRate,
    focusTimeScore,
    consistencyScore,
    qualityScore
  } = useProductivityScore();

  if (isLoading || scoreLoading) {
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

  const analyticsData = {
    tasks: tasksData,
    habits: habitsData,
    focus: focusData,
    overview: activityData
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analyse de Productivité</h1>
      </div>

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

      {/* Graphiques d'analyse */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Progression des Tâches</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={analyticsData.tasks} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Habitudes Complétées</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={analyticsData.habits} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions de Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleAreaChart data={analyticsData.focus} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition des Activités</CardTitle>
            </CardHeader>
            <CardContent>
              <SimplePieChart data={analyticsData.overview} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
