
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/ui/charts/SimplePieChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  CalendarCheck, Clock, BarChart3, AlertTriangle, 
  CheckCircle2, ListChecks, TrendingUp, Star 
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ChartData } from "@/components/ui/charts/types";
import { cn } from "@/lib/utils";

// Interface pour l'état du tableau de bord
interface DashboardState {
  tasks: any[];
  habits: any[];
  focusSessions: any[];
  journal: any[];
  goals: any[];
  loading: boolean;
  error: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardState>({
    tasks: [],
    habits: [],
    focusSessions: [],
    journal: [],
    goals: [],
    loading: true,
    error: false
  });
  const [chartData, setChartData] = useState({
    focusHoursData: [] as ChartData[],
    taskCompletionData: [] as ChartData[]
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    // Ne charger les données que si un utilisateur est connecté
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setData(prev => ({ ...prev, loading: true, error: false }));
      
      // Récupérer toutes les données de l'utilisateur en parallèle
      const [tasksResponse, habitsResponse, focusResponse, journalResponse, goalsResponse] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id)
      ]);
      
      // Vérifier les erreurs
      if (tasksResponse.error || habitsResponse.error || focusResponse.error || journalResponse.error || goalsResponse.error) {
        throw new Error("Erreur lors du chargement des données");
      }
      
      // Mettre à jour l'état avec les données récupérées
      const newData = {
        tasks: tasksResponse.data || [],
        habits: habitsResponse.data || [],
        focusSessions: focusResponse.data || [],
        journal: journalResponse.data || [],
        goals: goalsResponse.data || [],
        loading: false,
        error: false
      };
      
      setData(newData);
      
      // Générer les données de graphique basées sur les données réelles
      generateChartData(newData.focusSessions, newData.tasks);
      
    } catch (error) {
      console.error("Erreur lors du chargement des données du tableau de bord:", error);
      setData(prev => ({ ...prev, loading: false, error: true }));
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord.",
        variant: "destructive",
      });
    }
  };
  
  // Fonction pour générer les données des graphiques
  const generateChartData = (focusSessions: any[], tasks: any[]) => {
    // Obtenir la date actuelle et le début de la semaine
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    
    // Préparer les données pour le graphique de temps de concentration
    const focusHoursData = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeekDate, i);
      const sessionsForDay = focusSessions.filter(session => {
        const sessionDate = new Date(session.started_at);
        return sessionDate.getDate() === day.getDate() && 
              sessionDate.getMonth() === day.getMonth() && 
              sessionDate.getFullYear() === day.getFullYear();
      });
      
      // Calculer le temps total de concentration pour ce jour (en minutes)
      const totalFocusTime = sessionsForDay.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0);
      
      // Convertir en heures pour le graphique
      const focusHours = Math.round((totalFocusTime / 60) * 10) / 10;
      
      return {
        name: format(day, 'EEE', { locale: fr }),
        value: focusHours
      };
    });
    
    // Convertir les données de tâches en données pour graphique de complétion
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.filter(task => !task.completed).length;
    
    const taskCompletionData = [
      { name: 'Complétées', value: completedTasks },
      { name: 'En cours', value: pendingTasks }
    ];
    
    setChartData({
      focusHoursData,
      taskCompletionData
    });
  };
  
  // Calculer des statistiques pour le tableau de bord
  const stats = {
    totalFocusMinutes: data.focusSessions.reduce((total, session) => total + (session.duration || 0), 0),
    completedTasks: data.tasks.filter(task => task.completed).length,
    pendingTasks: data.tasks.filter(task => !task.completed).length,
    totalTasks: data.tasks.length,
    journalEntries: data.journal.length,
    habitStreaks: data.habits.reduce((total, habit) => total + (habit.streak || 0), 0),
    goalProgress: data.goals.length > 0 
      ? Math.round(data.goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / data.goals.length)
      : 0,
  };
  
  // Trouver les tâches qui arrivent à échéance bientôt
  const upcomingTasks = data.tasks
    .filter(task => !task.completed && task.due_date)
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 3);
  
  // Identifier les habitudes avec les meilleurs streaks
  const topHabits = [...data.habits]
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 3);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace personnel
        </p>
      </div>
      
      {data.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Une erreur est survenue lors du chargement des données. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Concentration" 
          value={`${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m`} 
          description="Temps total de concentration"
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        
        <StatCard 
          title="Tâches"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          description="Tâches complétées"
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
        />
        
        <StatCard 
          title="Habitudes"
          value={stats.habitStreaks.toString()}
          description="Total des streaks d'habitudes"
          icon={<CalendarCheck className="h-5 w-5 text-primary" />}
        />
        
        <StatCard 
          title="Objectifs"
          value={`${stats.goalProgress}%`}
          description="Progression moyenne des objectifs"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
      </div>
      
      {/* Graphiques et données importantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de concentration hebdomadaire */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Concentration hebdomadaire</CardTitle>
            <CardDescription>Temps de concentration par jour (en heures)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : chartData.focusHoursData.length > 0 ? (
              <div className="h-64">
                <SimpleBarChart
                  data={chartData.focusHoursData}
                  xAxisKey="name"
                  barKey="value"
                  className="h-64"
                  color="#7C3AED"
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Progression des tâches */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Progression des tâches</CardTitle>
            <CardDescription>Répartition de vos tâches</CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : chartData.taskCompletionData.length > 0 && 
                (chartData.taskCompletionData[0].value > 0 || chartData.taskCompletionData[1].value > 0) ? (
              <div className="h-64">
                <SimplePieChart
                  data={chartData.taskCompletionData}
                  nameKey="name"
                  valueKey="value"
                  className="h-64"
                  colors={["#10b981", "#7C3AED"]}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune tâche disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tâches à venir */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Tâches à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="w-full h-12 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map(task => {
                  const dueDate = task.due_date ? parseISO(task.due_date) : null;
                  const daysRemaining = dueDate ? differenceInDays(dueDate, new Date()) : null;
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {dueDate ? format(dueDate, 'dd MMM yyyy', { locale: fr }) : 'Pas de date'}
                        </p>
                      </div>
                      {daysRemaining !== null && (
                        <div className={cn("text-sm font-medium px-2 py-1 rounded-full", 
                          daysRemaining < 0 ? 'bg-destructive/10 text-destructive' : 
                          daysRemaining === 0 ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-primary/10 text-primary')}>
                          {daysRemaining < 0 
                            ? `En retard (${Math.abs(daysRemaining)}j)`
                            : daysRemaining === 0 
                              ? "Aujourd'hui"
                              : `Dans ${daysRemaining}j`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune tâche à venir</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Meilleures habitudes */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Star className="h-5 w-5" />
              Meilleures habitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="w-full h-12 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : topHabits.length > 0 ? (
              <div className="space-y-3">
                {topHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{habit.title}</p>
                      <p className="text-sm text-muted-foreground">{habit.frequency}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                      <CalendarCheck className="h-4 w-4" />
                      <span className="font-medium">{habit.streak || 0} jours</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune habitude suivie</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Composant de carte de statistique
function StatCard({ 
  title, 
  value, 
  description, 
  icon 
}: { 
  title: string; 
  value: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
