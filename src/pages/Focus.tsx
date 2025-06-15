
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mode Focus</h1>
        <span className="text-muted-foreground">
          Concentrez-vous sur ce qui compte vraiment.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-xl font-bold text-green-900">{completedSessionsToday}</p>
            <p className="text-sm text-green-700">Sessions aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <p className="text-xl font-bold text-blue-900">
              {currentSessionId ? (isActive ? "EN COURS" : "EN PAUSE") : "ARRÊTÉ"}
            </p>
            <p className="text-sm text-blue-700">Statut</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-xl font-bold text-purple-900">
              {minutesToday}
            </p>
            <p className="text-sm text-purple-700">Minutes aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Timer Card */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            {currentSessionId ? sessionTitle : "Nouvelle session"}
          </CardTitle>
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
                  placeholder="Ex: Étude de mathématiques, Lecture..."
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
            </div>
          )}

          <div className="text-8xl font-mono font-bold text-primary">
            {formatTime(timeLeft)}
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
              </>
            )}
          </div>

          {currentSessionId && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Session en cours...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
