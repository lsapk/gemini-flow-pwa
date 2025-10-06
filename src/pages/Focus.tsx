import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, TrendingUp, CheckCircle2, Target, ListTodo, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleBarChart } from "@/components/ui/charts/SimpleBarChart";
import { Progress } from "@/components/ui/progress";
import { Task } from "@/types";

interface ActiveFocusSession {
  id: string;
  title: string;
  duration: number;
  startTime: number;
  isActive: boolean;
  timeLeft: number;
  userId: string;
}

export default function Focus() {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ name: string; minutes: number }[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentSessionId) {
      setTimeLeft(duration * 60);
    }
  }, [duration, currentSessionId]);

  useEffect(() => {
    if (user) {
      loadSessionsToday();
      checkActiveSession();
      loadSessionsHistory();
      loadWeeklyData();
      loadTasks();
    }
  }, [user]);

  const loadSessionsToday = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration')
        .eq('user_id', user.id)
        .gte('started_at', today.toISOString())
        .not('completed_at', 'is', null);

      if (error) {
        console.error('Error loading sessions:', error);
      } else {
        setCompletedSessionsToday(data?.length || 0);
        const totalMinutes = data.reduce((sum, session) => sum + (session.duration || 0), 0);
        setMinutesToday(totalMinutes);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const checkActiveSession = () => {
    const savedSession = localStorage.getItem('active_focus_session');
    if (savedSession) {
      try {
        const session: ActiveFocusSession = JSON.parse(savedSession);
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = session.isActive ? (session.duration * 60 - elapsed) : session.timeLeft;
        
        if (remaining > 0) {
          setCurrentSessionId(session.id);
          setSessionTitle(session.title);
          setDuration(session.duration);
          setTimeLeft(Math.ceil(remaining));
          setIsActive(session.isActive);
        } else {
          localStorage.removeItem('active_focus_session');
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('active_focus_session');
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          const newTime = prev - 1;
          saveSessionState({ timeLeft: newTime });
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const saveSessionState = (updates: Partial<ActiveFocusSession>) => {
    const saved = localStorage.getItem('active_focus_session');
    if (saved) {
      const current = JSON.parse(saved);
      const newState = { ...current, ...updates };
      localStorage.setItem('active_focus_session', JSON.stringify(newState));
    }
  }

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    if (!sessionTitle.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez entrer un titre pour votre session de focus.",
        variant: "destructive",
      });
      return;
    }
    if (!user) return;

    const sessionId = `focus_${Date.now()}`;
    const startTime = new Date();
    
    setIsActive(true);
    setCurrentSessionId(sessionId);
    setTimeLeft(duration * 60);
    
    const sessionData: ActiveFocusSession = {
      id: sessionId,
      title: sessionTitle,
      duration: duration,
      startTime: startTime.getTime(),
      isActive: true,
      timeLeft: duration * 60,
      userId: user.id
    };
    localStorage.setItem('active_focus_session', JSON.stringify(sessionData));

    toast({
      title: "Session démarrée",
      description: `Session de ${duration} minutes commencée.`,
    });
  };

  const pauseTimer = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    saveSessionState({ isActive: newIsActive, timeLeft });

    toast({
      title: newIsActive ? "Session reprise" : "Session en pause",
    });
  };

  const stopTimer = async () => {
    if (!currentSessionId || !user) return;

    const sessionDataRaw = localStorage.getItem('active_focus_session');
    if (!sessionDataRaw) return;
    const sessionData: ActiveFocusSession = JSON.parse(sessionDataRaw);

    const completedDuration = sessionData.duration * 60 - timeLeft;

    try {
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          title: sessionData.title,
          duration: Math.floor(completedDuration / 60), // in minutes
          started_at: new Date(sessionData.startTime).toISOString(),
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast({
        title: "Session arrêtée",
        description: `Session enregistrée de ${Math.floor(completedDuration / 60)} minutes.`,
      });
      loadSessionsToday();
    } catch (error) {
      console.error('Error stopping session:', error);
      toast({
        variant: "destructive",
        title: "Erreur lors de l'arrêt de la session",
        description: "Un problème est survenu. Veuillez réessayer.",
      });
    } finally {
      localStorage.removeItem('active_focus_session');
      resetSession();
    }
  };
  
  const handleTimerComplete = async () => {
    if (!currentSessionId || !user) return;
    const sessionDataRaw = localStorage.getItem('active_focus_session');
    if (!sessionDataRaw) return;
    const sessionData: ActiveFocusSession = JSON.parse(sessionDataRaw);

    try {
      await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          title: sessionData.title,
          duration: sessionData.duration, // in minutes
          started_at: new Date(sessionData.startTime).toISOString(),
          completed_at: new Date().toISOString()
        });
      
      toast({
        title: "🎉 Session terminée !",
        description: `Félicitations ! Vous avez complété une session de ${duration} minutes.`,
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Session de focus terminée !', {
          body: `Vous avez terminé votre session "${sessionTitle}".`,
          icon: '/icons/icon-192x192.png'
        });
      }

    } catch (error) {
      console.error('Error completing session:', error);
    } finally {
      localStorage.removeItem('active_focus_session');
      resetSession();
      loadSessionsToday();
    }
  };

  const resetSession = () => {
    setIsActive(false);
    setCurrentSessionId(null);
    setTimeLeft(duration * 60);
    setSessionTitle("");
    setLinkedTaskId(null);
  };

  const loadSessionsHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessionsHistory(data || []);
    } catch (error) {
      console.error('Error loading sessions history:', error);
    }
  };

  const loadWeeklyData = async () => {
    if (!user) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration, started_at')
        .eq('user_id', user.id)
        .gte('started_at', sevenDaysAgo.toISOString())
        .not('completed_at', 'is', null);

      if (error) throw error;

      // Group by day
      const dayData: { [key: string]: number } = {};
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      
      data?.forEach((session) => {
        const date = new Date(session.started_at);
        const dayName = days[date.getDay()];
        dayData[dayName] = (dayData[dayName] || 0) + (session.duration || 0);
      });

      const chartData = days.map(day => ({
        name: day,
        minutes: dayData[day] || 0
      }));

      setWeeklyData(chartData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('priority', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTasks((data || []).map(task => ({
        ...task,
        priority: task.priority as 'high' | 'medium' | 'low'
      })));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const completeLinkedTask = async () => {
    if (!linkedTaskId || !user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', linkedTaskId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Tâche complétée !",
        description: "La tâche liée a été marquée comme terminée.",
      });

      loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mode Focus</h1>
          <p className="text-muted-foreground mt-1">
            Concentrez-vous sur ce qui compte vraiment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-2xl font-bold">{completedSessionsToday}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Minutes</p>
              <p className="text-2xl font-bold">{minutesToday}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <p className="text-sm font-semibold">
                {currentSessionId ? (isActive ? "EN COURS" : "PAUSE") : "PRÊT"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10">
              <History className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Moyenne/jour</p>
              <p className="text-2xl font-bold">
                {weeklyData.length > 0 
                  ? Math.round(weeklyData.reduce((sum, d) => sum + d.minutes, 0) / 7) 
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Card - Main */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentSessionId ? sessionTitle : "Nouvelle session"}
            </CardTitle>
            <CardDescription>
              {currentSessionId 
                ? `Session de ${duration} minutes en cours`
                : "Démarrez une session de concentration profonde"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!currentSessionId && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-title">Titre de la session</Label>
                  <Input
                    id="session-title"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Ex: Étude de mathématiques, Rédaction..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Durée (minutes)</Label>
                  <Select 
                    value={duration.toString()} 
                    onValueChange={(value) => {
                      const newDuration = parseInt(value);
                      setDuration(newDuration);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tasks.length > 0 && (
                  <div>
                    <Label htmlFor="linked-task">Lier à une tâche (optionnel)</Label>
                    <Select 
                      value={linkedTaskId || "none"} 
                      onValueChange={(value) => setLinkedTaskId(value === "none" ? null : value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner une tâche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune tâche</SelectItem>
                        {tasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <div className="text-7xl sm:text-8xl font-mono font-bold text-primary mb-4">
                {formatTime(timeLeft)}
              </div>
              
              {currentSessionId && (
                <Progress 
                  value={((duration * 60 - timeLeft) / (duration * 60)) * 100} 
                  className="h-2 mb-4"
                />
              )}
            </div>

            <div className="flex gap-2 justify-center">
              {!currentSessionId ? (
                <Button onClick={startTimer} size="lg" className="px-8">
                  <Play className="mr-2 h-5 w-5" />
                  Démarrer
                </Button>
              ) : (
                <>
                  <Button onClick={pauseTimer} variant="outline" size="lg">
                    {isActive ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Reprendre
                      </>
                    )}
                  </Button>
                  <Button onClick={stopTimer} variant="destructive" size="lg">
                    <Square className="mr-2 h-4 w-4" />
                    Arrêter
                  </Button>
                  {linkedTaskId && (
                    <Button onClick={completeLinkedTask} variant="default" size="lg">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Terminer tâche
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <Card className="lg:col-span-1">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-4 p-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Focus cette semaine</h3>
                {weeklyData.length > 0 ? (
                  <SimpleBarChart
                    data={weeklyData.map(d => ({ name: d.name, value: d.minutes }))}
                    xAxisKey="name"
                    barKey="value"
                    color="hsl(var(--primary))"
                    className="h-48"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </div>

              {tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Tâches en attente
                  </h3>
                  <div className="space-y-2">
                    {tasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className="text-xs p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setLinkedTaskId(task.id)}
                      >
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-muted-foreground capitalize">{task.priority}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-2 p-4">
              <h3 className="text-sm font-semibold mb-3">Sessions récentes</h3>
              {sessionsHistory.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sessionsHistory.map((session) => (
                    <div 
                      key={session.id} 
                      className="text-xs p-3 rounded-lg bg-muted/50 space-y-1"
                    >
                      <p className="font-medium truncate">{session.title}</p>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{session.duration} min</span>
                        <span>
                          {new Date(session.started_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune session enregistrée
                </p>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
