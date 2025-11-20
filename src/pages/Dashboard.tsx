
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Target, 
  Clock, 
  Brain,
  Zap,
  BookOpen,
  ListTodo,
  Flame
} from "lucide-react";
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

  // Calcul du score de productivité réaliste
  const productivityScore = Math.round(
    (taskCompletionRate * 0.4) + // 40% basé sur la complétion des tâches
    (Math.min((totalFocusTime / 300) * 100, 100) * 0.3) + // 30% basé sur 5h de focus
    (Math.min(streakCount * 10, 100) * 0.2) + // 20% basé sur la série
    (Math.min(activeHabits * 10, 100) * 0.1) // 10% basé sur les habitudes
  );

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-success" };
    if (score >= 60) return { label: "Bon", color: "text-primary" };
    if (score >= 40) return { label: "Moyen", color: "text-warning" };
    return { label: "À améliorer", color: "text-muted-foreground" };
  };

  const scoreLevel = getScoreLevel(productivityScore);

  const quickLinks = [
    { icon: ListTodo, label: "Tâches", path: "/tasks", color: "bg-success/10 text-success" },
    { icon: Target, label: "Objectifs", path: "/goals", color: "bg-primary/10 text-primary" },
    { icon: Flame, label: "Habitudes", path: "/habits", color: "bg-warning/10 text-warning" },
    { icon: Brain, label: "Focus", path: "/focus", color: "bg-info/10 text-info" },
    { icon: BookOpen, label: "Journal", path: "/journal", color: "bg-purple-500/10 text-purple-500" },
  ];

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Tableau de Bord
        </h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de votre productivité</p>
      </div>

      {/* Raccourcis rapides */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Card className="hover:shadow-md transition-all hover:scale-105 cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-lg ${link.color}`}>
                    <link.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Score de productivité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            Score de Productivité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold">{productivityScore}</div>
              <p className={`text-sm font-medium ${scoreLevel.color}`}>{scoreLevel.label}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {streakCount} jours 🔥
            </Badge>
          </div>
          
          <Progress value={productivityScore} className="h-3" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Tâches
              </div>
              <div className="text-xl font-semibold">{Math.round(taskCompletionRate)}%</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Focus
              </div>
              <div className="text-xl font-semibold">{Math.round(totalFocusTime / 60)}h</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-warning" />
                Série
              </div>
              <div className="text-xl font-semibold">{streakCount}j</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-info" />
                Habitudes
              </div>
              <div className="text-xl font-semibold">{activeHabits}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights IA */}
      <SmartInsightsWidget />
    </div>
  );
}
