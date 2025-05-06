import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleLineChart } from "@/components/ui/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { SimpleAreaChart } from "@/components/ui/charts/SimpleAreaChart";
import { SimplePieChart } from "@/components/ui/charts/SimplePieChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CalendarCheck, Clock, LineChart, ListTodo, ListChecks, BarChart3, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ChartData } from "@/components/ui/charts/types";

// Fonction pour générer un nombre aléatoire entre min et max
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fonction pour générer des données de graphique basées sur les données réelles de l'utilisateur
const generateChartData = (focusSessions: any[], tasks: any[]) => {
  // Obtenir la date actuelle et le début de la semaine
  const today = new Date();
  const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
  
  // Préparer les données pour le graphique de productivité
  const weekLabels = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeekDate, i);
    return format(day, 'EEE', { locale: fr });
  });
  
  // Convertir les données de sessions focus en données pour graphique
  const focusData = Array.from({ length: 7 }, (_, i) => {
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
    
    return {
      name: format(day, 'EEE', { locale: fr }),
      value: totalFocusTime // Temps en minutes
    };
  });
  
  // Convertir les données de tâches en données pour graphique de complétion
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  
  const taskCompletionData = [
    { name: 'Complétées', value: completedTasks },
    { name: 'En cours', value: pendingTasks }
  ];
  
  // Préparer les données pour le graphique de temps de concentration quotidien
  // Fixed: Changed the property name from 'hours' to 'value' to match ChartData interface
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
      value: focusHours // Changed from 'hours' to 'value' to match ChartData interface
    };
  });
  
  // Générer des données pour le graphique de productivité par catégories
  // Ici, nous utilisons les catégories des tâches si elles existent
  const tasksByCategory: Record<string, number> = {};
  tasks.forEach(task => {
    const category = task.priority || "non-définie";
    if (!tasksByCategory[category]) {
      tasksByCategory[category] = 0;
    }
    tasksByCategory[category]++;
  });
  
  const productivityByCategory = Object.entries(tasksByCategory).map(([name, value]) => {
    // Convertir les priorités en noms lisibles
    let displayName = name;
    if (name === "high") displayName = "Haute";
    else if (name === "medium") displayName = "Moyenne";
    else if (name === "low") displayName = "Basse";
    else if (name === "non-définie") displayName = "Non définie";
    
    return { name: displayName, value };
  });
  
  return {
    focusData,
    taskCompletionData,
    focusHoursData,
    productivityByCategory
  };
};

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
    focusData: [] as ChartData[],
    taskCompletionData: [] as ChartData[],
    focusHoursData: [] as ChartData[],
    productivityByCategory: [] as ChartData[]
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
      setData({
        tasks: tasksResponse.data || [],
        habits: habitsResponse.data || [],
        focusSessions: focusResponse.data || [],
        journal: journalResponse.data || [],
        goals: goalsResponse.data || [],
        loading: false,
        error: false
      });
      
      // Générer les données de graphique basées sur les données réelles
      const generatedChartData = generateChartData(focusResponse.data || [], tasksResponse.data || []);
      setChartData(generatedChartData);
      
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
  
  // Calculer des statistiques pour le tableau de bord
  const stats = {
    totalFocusMinutes: data.focusSessions.reduce((total, session) => total + (session.duration || 0), 0),
    completedTasks: data.tasks.filter(task => task.completed).length,
    pendingTasks: data.tasks.filter(task => !task.completed).length,
    totalTasks: data.tasks.length,
    journalEntries: data.journal.length,
    habitStreaks: data.habits.reduce((total, habit) => total + (habit.streak || 0), 0),
    goalProgress: data.goals.length > 0 
      ? Math.round(data.goals.reduce((sum, goal) => sum + goal.progress, 0) / data.goals.length)
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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
      
      {data.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Une erreur est survenue lors du chargement des données. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de concentration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.totalFocusMinutes / 60)}h {stats.totalFocusMinutes % 60}m
            </div>
            <p className="text-xs text-muted-foreground">
              Temps total de concentration
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedTasks}/{stats.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Tâches complétées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habitudes</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.habitStreaks}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des streaks d'habitudes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectifs</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.goalProgress}%
            </div>
            <p className="text-xs text-muted-foreground">
              Progression moyenne des objectifs
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Productivité</CardTitle>
            <CardDescription>
              Votre temps de concentration cette semaine
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {data.loading ? (
              <div className="h-80 flex items-center justify-center">
                Chargement...
              </div>
            ) : chartData.focusHoursData.length > 0 ? (
              <div className="h-80">
                <SimpleBarChart
                  data={chartData.focusHoursData}
                  xAxisKey="name"
                  barKey="value" {/* Updated from "hours" to "value" to match our data structure */}
                  className="h-80"
                  color="#7C3AED"
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Complétion des tâches</CardTitle>
            <CardDescription>
              Répartition de vos tâches
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {data.loading ? (
              <div className="h-80 flex items-center justify-center">
                Chargement...
              </div>
            ) : chartData.taskCompletionData.length > 0 ? (
              <div className="h-80">
                <SimplePieChart
                  data={chartData.taskCompletionData}
                  nameKey="name"
                  valueKey="value"
                  className="h-80"
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Habitudes</CardTitle>
            <CardDescription>
              Vos meilleures streaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-80 flex items-center justify-center">
                Chargement...
              </div>
            ) : topHabits.length > 0 ? (
              <div className="space-y-4">
                {topHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{habit.title}</p>
                      <p className="text-sm text-muted-foreground">{habit.frequency}</p>
                    </div>
                    <div className="text-lg font-bold">
                      {habit.streak} jours
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune habitude suivie
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Progrès</CardTitle>
            <CardDescription>
              Tâches à venir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="h-80 flex items-center justify-center">
                Chargement...
              </div>
            ) : upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map(task => {
                  const dueDate = task.due_date ? parseISO(task.due_date) : null;
                  const daysRemaining = dueDate ? differenceInDays(dueDate, new Date()) : null;
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {dueDate ? format(dueDate, 'PPP', { locale: fr }) : 'Pas de date'}
                        </p>
                      </div>
                      {daysRemaining !== null && (
                        <div className={`text-sm font-medium ${
                          daysRemaining < 0 ? 'text-destructive' : 
                          daysRemaining === 0 ? 'text-warning' : 
                          'text-primary'
                        }`}>
                          {daysRemaining < 0 
                            ? `En retard de ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? 's' : ''}`
                            : daysRemaining === 0 
                              ? "Aujourd'hui"
                              : `Dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune tâche à venir
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
