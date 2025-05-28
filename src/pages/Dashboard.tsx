import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/ui/charts/SimplePieChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  CalendarCheck, Clock, AlertTriangle, 
  CheckCircle2, ListChecks, TrendingUp, Star 
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, addDays, parseISO, differenceInDays, endOfWeek, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ChartData } from "@/components/ui/charts/types";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

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
  const isMobile = useIsMobile();
  
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
      if (tasksResponse.error) console.error("Erreur lors de la récupération des tâches:", tasksResponse.error);
      if (habitsResponse.error) console.error("Erreur lors de la récupération des habitudes:", habitsResponse.error);
      if (focusResponse.error) console.error("Erreur lors de la récupération des sessions de focus:", focusResponse.error);
      if (journalResponse.error) console.error("Erreur lors de la récupération des entrées de journal:", journalResponse.error);
      if (goalsResponse.error) console.error("Erreur lors de la récupération des objectifs:", goalsResponse.error);
      
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
      console.log("Données du tableau de bord chargées:", newData);
      
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
  
  // Fonction pour générer les données des graphiques avec calcul hebdomadaire
  const generateChartData = (focusSessions: any[], tasks: any[]) => {
    // Obtenir le début et la fin de la semaine actuelle (lundi à dimanche)
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 }); // 1 = lundi
    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
    
    console.log("Génération des données de graphiques avec:", { 
      focusSessionsCount: focusSessions.length,
      tasksCount: tasks.length,
      weekStart: startOfWeekDate,
      weekEnd: endOfWeekDate
    });
    
    // Préparer les données pour le graphique de temps de concentration
    const focusHoursData = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeekDate, i);
      const sessionsForDay = focusSessions.filter(session => {
        if (!session.started_at) return false;
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
    
    console.log("Données de graphiques générées:", { focusHoursData, taskCompletionData });
    
    setChartData({
      focusHoursData,
      taskCompletionData
    });
  };
  
  // Calculer des statistiques pour le tableau de bord avec temps hebdomadaire
  const stats = useMemo(() => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
    
    // Filtrer les sessions de focus de cette semaine uniquement
    const weeklyFocusSessions = data.focusSessions.filter(session => {
      if (!session.started_at) return false;
      const sessionDate = new Date(session.started_at);
      return isWithinInterval(sessionDate, { start: startOfWeekDate, end: endOfWeekDate });
    });
    
    const weeklyFocusMinutes = weeklyFocusSessions.reduce((total, session) => total + (session.duration || 0), 0);
    
    return {
      totalFocusMinutes: weeklyFocusMinutes, // Temps hebdomadaire uniquement
      completedTasks: data.tasks.filter(task => task.completed).length,
      pendingTasks: data.tasks.filter(task => !task.completed).length,
      totalTasks: data.tasks.length,
      journalEntries: data.journal.length,
      habitStreaks: data.habits.reduce((total, habit) => total + (habit.streak || 0), 0),
      goalProgress: data.goals.length > 0 
        ? Math.round(data.goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / data.goals.length)
        : 0,
    };
  }, [data]);
  
  // Trouver les tâches qui arrivent à échéance bientôt
  const upcomingTasks = useMemo(() => data.tasks
    .filter(task => !task.completed && task.due_date)
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 3), [data.tasks]);
  
  // Identifier les habitudes avec les meilleurs streaks
  const topHabits = useMemo(() => [...data.habits]
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 3), [data.habits]);
  
  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace personnel
        </p>
      </motion.div>
      
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard 
            title="Concentration" 
            value={`${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m`} 
            description="Cette semaine"
            icon={<Clock className="h-5 w-5 text-primary" />}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard 
            title="Tâches"
            value={`${stats.completedTasks}/${stats.totalTasks}`}
            description="Complétées"
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatCard 
            title="Habitudes"
            value={stats.habitStreaks.toString()}
            description="Streaks"
            icon={<CalendarCheck className="h-5 w-5 text-primary" />}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <StatCard 
            title="Objectifs"
            value={`${stats.goalProgress}%`}
            description="Progression"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
        </motion.div>
      </div>
      
      {/* Graphiques et données importantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de concentration hebdomadaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="shadow-md">
            <CardHeader className="pb-2 bg-primary/5">
              <CardTitle className="text-lg font-medium">Concentration hebdomadaire</CardTitle>
              <CardDescription>Temps de concentration par jour (en heures)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : chartData.focusHoursData.length > 0 && chartData.focusHoursData.some(item => item.value > 0) ? (
                <div className="h-64 p-2">
                  <SimpleBarChart
                    data={chartData.focusHoursData}
                    xAxisKey="name"
                    barKey="value"
                    className="h-64"
                    color="#7C3AED"
                  />
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center p-6">
                  <Clock className="h-12 w-12 mb-2 text-muted" />
                  <p className="text-muted-foreground text-center">Aucune donnée de concentration disponible pour cette semaine</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Progression des tâches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="shadow-md">
            <CardHeader className="pb-2 bg-primary/5">
              <CardTitle className="text-lg font-medium">Progression des tâches</CardTitle>
              <CardDescription>Répartition de vos tâches</CardDescription>
            </CardHeader>
            <CardContent>
              {data.loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : stats.totalTasks > 0 ? (
                <div className="h-64 p-2">
                  <SimplePieChart
                    data={chartData.taskCompletionData}
                    nameKey="name"
                    valueKey="value"
                    className="h-64"
                    colors={["#10b981", "#7C3AED"]}
                  />
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center p-6">
                  <ListChecks className="h-12 w-12 mb-2 text-muted" />
                  <p className="text-muted-foreground text-center">Aucune tâche disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tâches à venir */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card className="shadow-md">
            <CardHeader className="pb-2 bg-primary/5">
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
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border border-primary/10">
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
                <div className="py-8 flex flex-col items-center justify-center">
                  <ListChecks className="h-12 w-12 mb-2 text-muted" />
                  <p className="text-muted-foreground">Aucune tâche à venir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Meilleures habitudes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <Card className="shadow-md">
            <CardHeader className="pb-2 bg-primary/5">
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
                    <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border border-primary/10">
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
                <div className="py-8 flex flex-col items-center justify-center">
                  <Star className="h-12 w-12 mb-2 text-muted" />
                  <p className="text-muted-foreground">Aucune habitude suivie</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
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
    <Card className="shadow-md h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
