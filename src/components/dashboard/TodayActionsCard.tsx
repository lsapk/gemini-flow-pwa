import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Target, ListTodo, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isToday, parseISO } from "date-fns";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
}

interface Habit {
  id: string;
  title: string;
  streak: number | null;
  is_completed_today: boolean;
  is_archived: boolean | null;
}

export const TodayActionsCard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch tasks due today
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('id, title, completed, priority, due_date')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('priority', { ascending: true });
        
        // Fetch habits with today's completion status
        const { data: habitsData } = await supabase
          .from('habits')
          .select('id, title, streak, is_archived')
          .eq('user_id', user.id)
          .eq('is_archived', false);
        
        // Check completions for today
        const { data: completions } = await supabase
          .from('habit_completions')
          .select('habit_id')
          .eq('user_id', user.id)
          .eq('completed_date', today);
        
        const completedHabitIds = new Set(completions?.map(c => c.habit_id) || []);
        
        // Filter tasks due today
        const todayTasks = (tasksData || []).filter(task => {
          if (!task.due_date) return false;
          try {
            return isToday(parseISO(task.due_date));
          } catch {
            return false;
          }
        }) as Task[];
        
        // Add completion status to habits
        const habitsWithCompletion = (habitsData || []).map(habit => ({
          ...habit,
          is_completed_today: completedHabitIds.has(habit.id),
          is_archived: habit.is_archived || false
        })) as Habit[];
        
        setTasks(todayTasks);
        setHabits(habitsWithCompletion.filter(h => !h.is_completed_today));
      } catch (error) {
        console.error('Error fetching today actions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const todayTasks = tasks.slice(0, 3);
  const pendingHabits = habits.slice(0, 3);
  const totalPendingTasks = tasks.length;
  const totalPendingHabits = habits.length;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = todayTasks.length === 0 && pendingHabits.length === 0;

  if (isEmpty) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Tout est fait pour aujourd'hui !</h3>
            <p className="text-muted-foreground text-sm">Vous êtes à jour. Profitez de votre journée !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-heading">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          À faire aujourd'hui
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tâches prioritaires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-success" />
                Tâches prioritaires
              </h4>
              {totalPendingTasks > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{totalPendingTasks - 3} autres
                </Badge>
              )}
            </div>
            
            {todayTasks.length === 0 ? (
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">Aucune tâche pour aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs flex-shrink-0 ${
                        task.priority === 'high' 
                          ? 'border-destructive/50 text-destructive' 
                          : task.priority === 'medium'
                          ? 'border-warning/50 text-warning'
                          : 'border-muted-foreground/50'
                      }`}
                    >
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Voir toutes les tâches <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Habitudes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-warning" />
                Habitudes à compléter
              </h4>
              {totalPendingHabits > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{totalPendingHabits - 3} autres
                </Badge>
              )}
            </div>
            
            {pendingHabits.length === 0 ? (
              <div className="p-3 rounded-lg bg-success/10 text-center border border-success/20">
                <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-sm text-success">Toutes les habitudes sont faites !</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingHabits.map((habit) => (
                  <div 
                    key={habit.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{habit.title}</p>
                    </div>
                    {habit.streak && habit.streak > 0 && (
                      <Badge variant="outline" className="text-xs border-warning/50 text-warning flex-shrink-0">
                        🔥 {habit.streak}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Link to="/habits">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Voir toutes les habitudes <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
