
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

export default function Focus() {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionsToday, setSessionsToday] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<Date | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setTimeLeft(duration * 60);
  }, [duration]);

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
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', today.toISOString())
        .not('completed_at', 'is', null);

      if (error) {
        console.error('Error loading sessions:', error);
      } else {
        setSessionsToday(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const checkActiveSession = () => {
    const savedSession = localStorage.getItem('active_focus_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = session.duration * 60 - elapsed;
        
        if (remaining > 0) {
          setCurrentSessionId(session.id);
          setSessionTitle(session.title);
          setDuration(session.duration);
          setTimeLeft(remaining);
          setIsActive(true);
          setCurrentSessionStartTime(new Date(session.startTime));
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
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

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

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour utiliser le focus.",
        variant: "destructive",
      });
      return;
    }

    const sessionId = `focus_${Date.now()}`;
    const startTime = new Date();
    
    try {
      // Save session to database
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          id: sessionId,
          user_id: user.id,
          title: sessionTitle,
          duration: duration,
          started_at: startTime.toISOString(),
        });

      if (error) {
        console.error('Error saving session:', error);
        throw error;
      }

      setCurrentSessionId(sessionId);
      setCurrentSessionStartTime(startTime);
      setIsActive(true);
      setTimeLeft(duration * 60);

      // Save to localStorage for persistence
      const sessionData = {
        id: sessionId,
        title: sessionTitle,
        duration: duration,
        startTime: startTime.getTime(),
        userId: user.id
      };
      localStorage.setItem('active_focus_session', JSON.stringify(sessionData));

      toast({
        title: "Session démarrée",
        description: `Session de ${duration} minutes commencée.`,
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la session.",
        variant: "destructive",
      });
    }
  };

  const pauseTimer = () => {
    setIsActive(!isActive);
    
    if (isActive) {
      toast({
        title: "Session en pause",
        description: "Votre session de focus a été mise en pause.",
      });
    } else {
      toast({
        title: "Session reprise",
        description: "Votre session de focus a été reprise.",
      });
    }
  };

  const stopTimer = async () => {
    if (!currentSessionId || !user) return;

    try {
      // Calculate completed duration
      const completedDuration = duration * 60 - timeLeft;
      
      // Update session in database
      await supabase
        .from('focus_sessions')
        .update({
          completed_at: new Date().toISOString(),
          duration: Math.floor(completedDuration / 60)
        })
        .eq('id', currentSessionId);

      // Clear localStorage
      localStorage.removeItem('active_focus_session');
      
      resetSession();

      toast({
        title: "Session arrêtée",
        description: `Session arrêtée après ${Math.floor(completedDuration / 60)} minutes.`,
      });

      loadSessionsToday();
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const handleTimerComplete = async () => {
    if (!currentSessionId || !user) return;

    try {
      // Update session in database as completed
      await supabase
        .from('focus_sessions')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId);

      // Clear localStorage
      localStorage.removeItem('active_focus_session');

      setSessionsToday(prev => prev + 1);
      resetSession();

      toast({
        title: "🎉 Session terminée !",
        description: `Félicitations ! Vous avez complété une session de ${duration} minutes.`,
      });

      // Show notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Session de focus terminée !', {
          body: `Vous avez terminé votre session "${sessionTitle}".`,
          icon: '/icons/icon-192x192.png'
        });
      }

      loadSessionsToday();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const resetSession = () => {
    setIsActive(false);
    setCurrentSessionId(null);
    setCurrentSessionStartTime(null);
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
            <p className="text-xl font-bold text-green-900">{sessionsToday}</p>
            <p className="text-sm text-green-700">Sessions aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <p className="text-xl font-bold text-blue-900">
              {isActive ? "EN COURS" : "ARRÊTÉ"}
            </p>
            <p className="text-sm text-blue-700">Statut</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-xl font-bold text-purple-900">
              {sessionsToday * 25}
            </p>
            <p className="text-sm text-purple-700">Minutes aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Timer Card */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isActive ? "Session en cours" : "Nouvelle session"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isActive && !currentSessionId && (
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
                <Select value={duration.toString()} onValueChange={(value) => {
                  const newDuration = parseInt(value);
                  setDuration(newDuration);
                  setTimeLeft(newDuration * 60);
                }}>
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
            {!isActive && !currentSessionId ? (
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
            <div className="text-center">
              <p className="text-lg font-medium">{sessionTitle}</p>
              <p className="text-sm text-muted-foreground">
                Session démarrée à {currentSessionStartTime?.toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
