
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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tâches Complétées</CardTitle>
            <div className="p-2.5 bg-success-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-success">
                {completedTasks}<span className="text-lg text-muted-foreground font-normal">/{totalTasks}</span>
              </div>
              <Progress value={taskCompletionRate} className="h-2" />
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                {taskCompletionRate.toFixed(0)}% de réussite
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Temps de Focus</CardTitle>
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-primary">
                {Math.round(totalFocusTime / 60)}<span className="text-lg text-muted-foreground font-normal">h</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Moyenne:</span>
                <Badge variant="secondary" className="font-medium">{avgFocusTime}min</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round(totalFocusTime)} minutes au total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Série Actuelle</CardTitle>
            <div className="p-2.5 bg-warning-muted rounded-lg">
              <Zap className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-warning">
                {streakCount}<span className="text-lg text-muted-foreground font-normal">j</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {streakCount >= 7 && <Badge className="bg-warning-muted text-warning border-warning/20">🔥 En feu!</Badge>}
                {streakCount >= 30 && <Badge className="bg-success-muted text-success border-success/20">🏆 Champion!</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                jours consécutifs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Habitudes Actives</CardTitle>
            <div className="p-2.5 bg-info-muted rounded-lg">
              <Target className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-info">
                {activeHabits}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">en cours</span>
                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                  <Link to="/habits" className="text-info hover:text-info/80">
                    <ArrowUpRight className="h-4 w-4" />
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
              <CardTitle className="flex items-center gap-2.5">
                <Activity className="h-5 w-5 text-primary" />
                Tendances d'Activité
              </CardTitle>
              <Badge variant="outline" className="font-medium">7 derniers jours</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-info" />
                  Activité Générale
                </h4>
                <SimpleLineChart 
                  data={activityChartData}
                  lines={[{ dataKey: "value", name: "Activité", color: "hsl(var(--info))" }]}
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
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
        <SmartInsightsWidget />
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
