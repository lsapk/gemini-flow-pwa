
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheckIcon, ChartLineIcon, ListTodoIcon, TargetIcon, TimerIcon, BrainCircuitIcon } from "@/components/icons/DeepFlowIcons";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getTasks, getHabits, getGoals } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasks: { total: 0, pending: 0 },
    habits: { total: 0 },
    goals: { total: 0, inProgress: 0 }
  });
  
  // Get time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch real data from API
        const [tasksRes, habitsRes, goalsRes] = await Promise.all([
          getTasks(),
          getHabits(),
          getGoals()
        ]);
        
        const tasks = tasksRes.data || [];
        const habits = habitsRes.data || [];
        const goals = goalsRes.data || [];
        
        // Calculate stats
        const pendingTasks = tasks.filter(task => !task.completed).length;
        const inProgressGoals = goals.filter(goal => !goal.completed).length;
        
        setStats({
          tasks: { total: tasks.length, pending: pendingTasks },
          habits: { total: habits.length },
          goals: { total: goals.length, inProgress: inProgressGoals }
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, <span className="text-primary">{user?.user_metadata?.display_name || user?.profile?.display_name || "utilisateur"}</span> !
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre journée et de vos activités.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="dashboard-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{stats.tasks.pending}</CardTitle>
                <CardDescription>Tâches à faire aujourd'hui</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/tasks">
                  <Button variant="outline" className="w-full">
                    Voir détails
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{stats.habits.total}</CardTitle>
                <CardDescription>Habitudes suivies</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/habits">
                  <Button variant="outline" className="w-full">
                    Voir détails
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{stats.goals.inProgress}</CardTitle>
                <CardDescription>Objectifs en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/goals">
                  <Button variant="outline" className="w-full">
                    Voir détails
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick access */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/tasks" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <ListTodoIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Tâches</span>
            </div>
          </Link>
          
          <Link to="/habits" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <CalendarCheckIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Habitudes</span>
            </div>
          </Link>
          
          <Link to="/focus" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <TimerIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Focus</span>
            </div>
          </Link>
          
          <Link to="/analysis" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <ChartLineIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Analyse IA</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Assistant IA - replacement for Focus du jour */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assistant IA</h2>
        <Card className="dashboard-card">
          <CardContent className="p-6 flex flex-col md:flex-row items-center text-center md:text-left gap-4">
            <div className="flex-shrink-0">
              <BrainCircuitIcon className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium mb-2">Votre assistant personnel intelligent</p>
              <p className="text-muted-foreground mb-4">Posez des questions, obtenez des conseils personnalisés et améliorez votre productivité</p>
              <Link to="/assistant">
                <Button>
                  Discuter avec l'IA
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
