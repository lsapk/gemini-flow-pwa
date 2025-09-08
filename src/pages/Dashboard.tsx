
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleLineChart } from "@/components/ui/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Target, 
  Clock, 
  TrendingUp,
  Calendar,
  Brain,
  Zap,
  Trophy,
  ArrowUpRight,
  Activity,
  Users,
  BookOpen
} from "lucide-react";
import { EnhancedProductivityDashboard } from "@/components/EnhancedProductivityDashboard";
import { SmartInsightsWidget } from "@/components/SmartInsightsWidget";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount, 
    habitsData, 
    tasksData, 
    focusData, 
    activityData,
    isLoading 
  } = useAnalyticsData();

  // Préparer les données des graphiques
  const activityChartData = activityData.map(item => ({
    name: new Date(item.date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: item.count
  }));

  const focusChartData = focusData.map(item => ({
    name: new Date(item.date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: item.minutes
  }));

  // Calculs pour les métriques rapides
  const completedTasks = tasksData?.filter(task => task.completed).length || 0;
  const totalTasks = tasksData?.length || 0;
  const activeHabits = habitsData?.length || 0;
  const avgFocusTime = focusData.length > 0 ? Math.round(totalFocusTime / focusData.length) : 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec navigation rapide */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tableau de Bord
          </h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre productivité aujourd'hui</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tasks" className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Tâches
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/habits" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Habitudes
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/focus" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Focus
            </Link>
          </Button>
        </div>
      </div>

      {/* Métriques principales améliorées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tâches Complétées</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {completedTasks}<span className="text-lg text-muted-foreground">/{totalTasks}</span>
              </div>
              <Progress value={taskCompletionRate} className="h-2" />
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {taskCompletionRate.toFixed(0)}% de réussite
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Temps de Focus</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(totalFocusTime / 60)}<span className="text-lg text-muted-foreground">h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Moyenne:</span>
                <Badge variant="secondary">{avgFocusTime}min</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round(totalFocusTime)} minutes au total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Série Actuelle</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-600">
                {streakCount}<span className="text-lg text-muted-foreground">j</span>
              </div>
              <div className="flex items-center gap-2">
                {streakCount >= 7 && <Badge className="bg-orange-100 text-orange-700">🔥 En feu!</Badge>}
                {streakCount >= 30 && <Badge className="bg-yellow-100 text-yellow-700">🏆 Champion!</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                jours consécutifs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Habitudes Actives</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {activeHabits}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">en cours</span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/habits" className="text-blue-600 hover:text-blue-700">
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard de productivité amélioré */}
      <EnhancedProductivityDashboard />

      {/* Section d'analyse et insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activité récente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Tendances d'Activité
              </CardTitle>
              <Badge variant="outline">7 derniers jours</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Activité Générale
                </h4>
                <SimpleLineChart 
                  data={activityChartData}
                  lines={[{ dataKey: "value", name: "Activité", color: "#3b82f6" }]}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Sessions de Focus
                </h4>
                <SimpleBarChart 
                  data={focusChartData}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget d'insights IA */}
        <Card>
          <SmartInsightsWidget />
        </Card>
      </div>

      {/* Résumé des habitudes amélioré */}
      {habitsData && habitsData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Habitudes du Jour
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/habits">
                  Voir tout <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {habitsData.slice(0, 6).map((habit, index) => (
                <div key={index} className="group flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{habit.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Quotidienne</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-bold text-primary">
                        {habit.value}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        jours
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button className="h-auto p-4 flex flex-col items-start gap-2" variant="outline" asChild>
              <Link to="/journal">
                <BookOpen className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Journal</div>
                  <div className="text-xs text-muted-foreground">Réfléchir sur votre journée</div>
                </div>
              </Link>
            </Button>
            <Button className="h-auto p-4 flex flex-col items-start gap-2" variant="outline" asChild>
              <Link to="/goals">
                <Trophy className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Objectifs</div>
                  <div className="text-xs text-muted-foreground">Planifier vos buts</div>
                </div>
              </Link>
            </Button>
            <Button className="h-auto p-4 flex flex-col items-start gap-2" variant="outline" asChild>
              <Link to="/analysis">
                <TrendingUp className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Analyse</div>
                  <div className="text-xs text-muted-foreground">Voir vos progrès</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
