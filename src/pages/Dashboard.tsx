
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
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Tableau de Bord
        </h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de votre productivité</p>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tâches</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {completedTasks}/{totalTasks}
            </div>
            <Progress value={taskCompletionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Temps Focus</CardTitle>
            <Brain className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(totalFocusTime / 60)}h
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Moyenne: {avgFocusTime}min
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Série</CardTitle>
            <Zap className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {streakCount} jours
            </div>
            {streakCount >= 7 && (
              <Badge variant="secondary" className="mt-2 bg-warning/10 text-warning">
                🔥 En feu!
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Habitudes</CardTitle>
            <Target className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {activeHabits}
            </div>
            <p className="text-xs text-muted-foreground mt-2">actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Score de productivité */}
      <EnhancedProductivityDashboard />

      {/* Insights IA */}
      <SmartInsightsWidget />
    </div>
  );
}
