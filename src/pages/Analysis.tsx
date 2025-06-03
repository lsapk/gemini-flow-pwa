
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Target, 
  Calendar,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Brain,
  Lightbulb
} from "lucide-react";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/ui/charts/SimplePieChart";
import { SimpleLineChart } from "@/components/ui/charts/SimpleLineChart";

interface AnalyticsData {
  totalGoals: number;
  completedGoals: number;
  totalHabits: number;
  activeStreaks: number;
  totalTasks: number;
  completedTasks: number;
  journalEntries: number;
  productivityScore: number;
  weeklyProgress: any[];
  habitProgress: any[];
  tasksByPriority: any[];
}

export default function Analysis() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Récupérer toutes les données en parallèle
      const [goalsData, habitsData, tasksData, journalData, focusData] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id)
      ]);

      const goals = goalsData.data || [];
      const habits = habitsData.data || [];
      const tasks = tasksData.data || [];
      const journalEntries = journalData.data || [];
      const focusSessions = focusData.data || [];

      // Calculer les métriques
      const completedGoals = goals.filter(g => g.completed).length;
      const completedTasks = tasks.filter(t => t.completed).length;
      const activeStreaks = habits.filter(h => (h.streak || 0) > 0).length;

      // Données pour les graphiques
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const weeklyProgress = last7Days.map(date => {
        const dayTasks = tasks.filter(t => 
          t.completed && t.updated_at?.startsWith(date)
        ).length;
        const dayJournal = journalEntries.filter(j => 
          j.created_at?.startsWith(date)
        ).length;
        return {
          name: new Date(date).toLocaleDateString('fr', {weekday: 'short'}),
          tasks: dayTasks,
          journal: dayJournal
        };
      });

      const habitProgress = habits.map(h => ({
        name: h.title.substring(0, 10),
        streak: h.streak || 0
      }));

      const tasksByPriority = [
        { name: 'Haute', value: tasks.filter(t => t.priority === 'high').length },
        { name: 'Moyenne', value: tasks.filter(t => t.priority === 'medium').length },
        { name: 'Basse', value: tasks.filter(t => t.priority === 'low').length }
      ];

      // Calculer le score de productivité
      const goalCompletionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
      const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      const habitConsistency = habits.length > 0 ? (activeStreaks / habits.length) * 100 : 0;
      const productivityScore = Math.round((goalCompletionRate + taskCompletionRate + habitConsistency) / 3);

      setAnalytics({
        totalGoals: goals.length,
        completedGoals,
        totalHabits: habits.length,
        activeStreaks,
        totalTasks: tasks.length,
        completedTasks,
        journalEntries: journalEntries.length,
        productivityScore,
        weeklyProgress,
        habitProgress,
        tasksByPriority
      });

      // Générer des insights
      generateInsights(goals, habits, tasks, journalEntries, focusSessions);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les analyses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (goals: any[], habits: any[], tasks: any[], journal: any[], focus: any[]) => {
    const insightsList = [];

    // Insights basés sur les données
    if (goals.length > 0) {
      const completionRate = (goals.filter(g => g.completed).length / goals.length) * 100;
      if (completionRate > 75) {
        insightsList.push("🎯 Excellent ! Vous atteignez la plupart de vos objectifs.");
      } else if (completionRate < 25) {
        insightsList.push("💡 Conseil: Essayez de décomposer vos objectifs en étapes plus petites.");
      }
    }

    if (habits.length > 0) {
      const avgStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length;
      if (avgStreak > 7) {
        insightsList.push("🔥 Vos habitudes sont bien ancrées ! Continuez comme ça.");
      } else {
        insightsList.push("⚡ Concentrez-vous sur 2-3 habitudes pour développer de meilleures séries.");
      }
    }

    if (tasks.length > 0) {
      const pendingHighPriority = tasks.filter(t => !t.completed && t.priority === 'high').length;
      if (pendingHighPriority > 3) {
        insightsList.push("🚨 Vous avez plusieurs tâches haute priorité en attente. Concentrez-vous dessus !");
      }
    }

    if (journal.length > 10) {
      insightsList.push("📝 Votre pratique du journal est excellente pour l'auto-réflexion !");
    }

    if (focus.length > 0) {
      const totalFocusTime = focus.reduce((sum, s) => sum + (s.duration || 0), 0);
      if (totalFocusTime > 600) { // plus de 10h
        insightsList.push("🧠 Votre temps de focus cumulé est impressionnant !");
      }
    }

    setInsights(insightsList);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-7xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-7xl">
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg">Aucune donnée disponible pour l'analyse.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl sm:text-3xl font-bold">Analyse & Insights</h1>
      </div>

      {/* Score de productivité */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Score de Productivité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {analytics.productivityScore}%
            </div>
            <Progress value={analytics.productivityScore} className="mb-4" />
            <p className="text-muted-foreground">
              {analytics.productivityScore > 80 ? "Excellent !" : 
               analytics.productivityScore > 60 ? "Bon travail !" : 
               analytics.productivityScore > 40 ? "En progrès" : "À améliorer"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Métriques clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Objectifs</p>
                <p className="text-2xl font-bold">{analytics.completedGoals}/{analytics.totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Habitudes</p>
                <p className="text-2xl font-bold">{analytics.activeStreaks}/{analytics.totalHabits}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches</p>
                <p className="text-2xl font-bold">{analytics.completedTasks}/{analytics.totalTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Journal</p>
                <p className="text-2xl font-bold">{analytics.journalEntries}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progrès Hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={analytics.weeklyProgress}
              keys={['tasks', 'journal']}
              colors={['#8884d8', '#82ca9d']}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Tâches par Priorité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePieChart 
              data={analytics.tasksByPriority}
              colors={['#ff6b6b', '#ffd93d', '#6bcf7f']}
            />
          </CardContent>
        </Card>
      </div>

      {/* Insights personnalisés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights Personnalisés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Continuez à utiliser l'application pour recevoir des insights personnalisés !</p>
          )}
        </CardContent>
      </Card>

      {/* Graphique des habitudes */}
      {analytics.habitProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Séries d'Habitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={analytics.habitProgress}
              dataKey="streak"
              color="#8884d8"
            />
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={loadAnalytics} 
        className="w-full"
        variant="outline"
      >
        Actualiser les analyses
      </Button>
    </div>
  );
}
