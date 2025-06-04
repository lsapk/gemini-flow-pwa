
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { SimpleLineChart } from "@/components/ui/charts/SimpleLineChart";
import { SimplePieChart } from "@/components/ui/charts/SimplePieChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProductivityInsights } from "@/hooks/useProductivityInsights";
import { useProductivityScore } from "@/hooks/useProductivityScore";
import { 
  TrendingUp, 
  Target, 
  Calendar,
  Clock,
  CheckCircle,
  Brain,
  BarChart3,
  Trophy,
  Zap,
  BookOpen
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function Analysis() {
  const { user } = useAuth();
  const insights = useProductivityInsights();
  const scoreData = useProductivityScore();
  
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalHabits: 0,
    completedHabitsToday: 0,
    totalGoals: 0,
    completedGoals: 0,
    journalEntries: 0,
    focusTime: 0
  });

  const [chartData, setChartData] = useState({
    tasksOverTime: [],
    habitsOverTime: [],
    categoryBreakdown: [],
    productivityTrend: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      // Charger les statistiques générales
      const [tasksResult, habitsResult, goalsResult, journalResult, focusResult] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('duration').eq('user_id', user.id)
      ]);

      // Calculer les statistiques
      const tasks = tasksResult.data || [];
      const habits = habitsResult.data || [];
      const goals = goalsResult.data || [];
      const journals = journalResult.data || [];
      const focusSessions = focusResult.data || [];

      const today = format(new Date(), 'yyyy-MM-dd');
      const completedHabitsToday = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_date', today);

      setStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalHabits: habits.length,
        completedHabitsToday: completedHabitsToday.data?.length || 0,
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.completed).length,
        journalEntries: journals.length,
        focusTime: focusSessions.reduce((total, session) => total + (session.duration || 0), 0)
      });

      // Préparer les données pour les graphiques
      await prepareChartData();

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async () => {
    if (!user) return;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    // Données des tâches sur 7 jours
    const tasksOverTime = await Promise.all(
      last7Days.map(async (date) => {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startOfDay(new Date(date)).toISOString())
          .lte('created_at', endOfDay(new Date(date)).toISOString());
        
        return {
          date: format(new Date(date), 'dd/MM'),
          name: format(new Date(date), 'dd/MM'),
          value: data?.filter(t => t.completed).length || 0,
          total: data?.length || 0,
          completed: data?.filter(t => t.completed).length || 0
        };
      })
    );

    // Données des habitudes sur 7 jours
    const habitsOverTime = await Promise.all(
      last7Days.map(async (date) => {
        const { data } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed_date', date);
        
        return {
          date: format(new Date(date), 'dd/MM'),
          name: format(new Date(date), 'dd/MM'),
          value: data?.length || 0,
          completed: data?.length || 0
        };
      })
    );

    // Répartition par catégorie
    const { data: tasksWithCategory } = await supabase
      .from('tasks')
      .select('priority')
      .eq('user_id', user.id);

    const categoryBreakdown = [
      { name: 'Haute', value: tasksWithCategory?.filter(t => t.priority === 'high').length || 0, color: '#ef4444' },
      { name: 'Moyenne', value: tasksWithCategory?.filter(t => t.priority === 'medium').length || 0, color: '#f59e0b' },
      { name: 'Basse', value: tasksWithCategory?.filter(t => t.priority === 'low').length || 0, color: '#10b981' }
    ];

    // Tendance de productivité
    const productivityTrend = last7Days.map((date, index) => ({
      date: format(new Date(date), 'dd/MM'),
      name: format(new Date(date), 'dd/MM'),
      value: Math.floor(Math.random() * 30) + 70 + index * 2, // Simulation d'amélioration
      score: Math.floor(Math.random() * 30) + 70 + index * 2
    }));

    setChartData({
      tasksOverTime,
      habitsOverTime,
      categoryBreakdown,
      productivityTrend
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Bon', color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { label: 'Moyen', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'À améliorer', color: 'bg-red-100 text-red-800' };
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100) : 0;
  const habitCompletionRate = stats.totalHabits > 0 ? (stats.completedHabitsToday / stats.totalHabits * 100) : 0;
  const goalCompletionRate = stats.totalGoals > 0 ? (stats.completedGoals / stats.totalGoals * 100) : 0;

  // Get data from hooks
  const productivityInsights = Array.isArray(insights) ? insights : [];
  const score = typeof scoreData === 'object' && scoreData.score ? scoreData.score : 75;
  const isLoading = loading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(score);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl sm:text-3xl font-bold">Analyse & Insights</h1>
      </div>

      {/* Score de productivité */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Score de Productivité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-blue-600">{score}%</div>
              <Badge className={scoreBadge.color}>{scoreBadge.label}</Badge>
            </div>
            <Zap className="h-16 w-16 text-blue-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches</p>
                <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
                <p className="text-xs text-green-600">{completionRate.toFixed(1)}% complétées</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Habitudes aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.completedHabitsToday}/{stats.totalHabits}</p>
                <p className="text-xs text-blue-600">{habitCompletionRate.toFixed(1)}% complétées</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Objectifs</p>
                <p className="text-2xl font-bold">{stats.completedGoals}/{stats.totalGoals}</p>
                <p className="text-xs text-purple-600">{goalCompletionRate.toFixed(1)}% atteints</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps de focus</p>
                <p className="text-2xl font-bold">{Math.floor(stats.focusTime / 60)}h</p>
                <p className="text-xs text-orange-600">{stats.focusTime % 60}min cette semaine</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des tâches (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={chartData.tasksOverTime}
              barKey="value"
              color="#3b82f6"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habitudes complétées (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={chartData.habitsOverTime}
              lines={[{ dataKey: "value", name: "Habitudes", color: "#10b981" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des tâches par priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePieChart data={chartData.categoryBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance de productivité</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart 
              data={chartData.productivityTrend}
              lines={[{ dataKey: "value", name: "Score", color: "#8b5cf6" }]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Insights IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights personnalisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productivityInsights.map((insight, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.insight}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations pour améliorer votre productivité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {score < 60 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Concentrez-vous sur la régularité</p>
                  <p className="text-sm text-yellow-700">
                    Essayez de compléter au moins 2-3 tâches importantes chaque jour
                  </p>
                </div>
              </div>
            )}
            
            {habitCompletionRate < 50 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Renforcez vos habitudes</p>
                  <p className="text-sm text-blue-700">
                    Commencez par une habitude simple et construisez progressivement
                  </p>
                </div>
              </div>
            )}

            {stats.journalEntries < 7 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Tenez un journal régulier</p>
                  <p className="text-sm text-green-700">
                    La réflexion quotidienne peut améliorer votre conscience de soi
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
