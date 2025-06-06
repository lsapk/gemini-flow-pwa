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
import BackgroundFocusService from "@/services/backgroundFocus";

export default function Focus() {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionsToday, setSessionsToday] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const focusService = BackgroundFocusService.getInstance();

  useEffect(() => {
    if (user) {
      loadSessionsToday();
    }
  }, [user]);

  useEffect(() => {
    // Check for active session on mount
    const activeSessions = focusService.getAllActiveSessions();
    if (activeSessions.length > 0) {
      const activeSession = activeSessions[0];
      setCurrentSessionId(activeSession.id);
      setSessionTitle(activeSession.title);
      setDuration(Math.ceil(activeSession.timeLeft / 60));
      setTimeLeft(activeSession.timeLeft);
      setIsActive(true);

      focusService.onSessionUpdate(activeSession.id, (timeLeft, isComplete) => {
        setTimeLeft(timeLeft);
        if (isComplete) {
          handleTimerComplete();
        }
      });
    }
  }, []);

  const loadSessionsToday = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', today.toISOString())
      .not('completed_at', 'is', null);

    if (error) {
      console.error('Error loading sessions:', error);
    } else {
      setSessionsToday(data.length);
    }
  };

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

    const sessionId = `focus_${Date.now()}`;
    setCurrentSessionId(sessionId);
    
    try {
      // Save session to database
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user?.id,
          title: sessionTitle,
          duration: duration,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Start background session
      focusService.startSession(sessionId, sessionTitle, duration);
      focusService.onSessionUpdate(sessionId, (timeLeft, isComplete) => {
        setTimeLeft(timeLeft);
        if (isComplete) {
          handleTimerComplete();
        }
      });

      setIsActive(true);
      toast({
        title: "Session démarrée",
        description: `Session de ${duration} minutes commencée. Elle continuera en arrière-plan.`,
      });
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
    if (currentSessionId) {
      if (isActive) {
        focusService.pauseSession(currentSessionId);
        setIsActive(false);
      } else {
        focusService.resumeSession(currentSessionId);
        setIsActive(true);
      }
    }
  };

  const stopTimer = () => {
    if (currentSessionId) {
      focusService.stopSession(currentSessionId);
      setCurrentSessionId(null);
    }
    setIsActive(false);
    setTimeLeft(duration * 60);
  };

  const handleTimerComplete = async () => {
    if (!currentSessionId) return;

    try {
      // Update session in database
      await supabase
        .from('focus_sessions')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId);

      setSessionsToday(prev => prev + 1);
      setIsActive(false);
      setCurrentSessionId(null);
      setTimeLeft(duration * 60);
      setSessionTitle("");

      toast({
        title: "🎉 Session terminée !",
        description: `Félicitations ! Vous avez complété une session de ${duration} minutes.`,
      });
    } catch (error) {
      console.error('Error completing session:', error);
    }
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
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-xl font-bold text-blue-900">
              {/* Placeholder for streak */}
              7
            </p>
            <p className="text-sm text-blue-700">Jours de suite</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-xl font-bold text-purple-900">
              {/* Placeholder for total */}
              42
            </p>
            <p className="text-sm text-purple-700">Sessions totales</p>
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
          {!isActive && (
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
            {!isActive ? (
              <Button onClick={startTimer} size="lg" className="px-8">
                <Play className="mr-2 h-5 w-5" />
                Démarrer
              </Button>
            ) : (
              <>
                <Button onClick={pauseTimer} variant="outline" size="lg">
                  {focusService.isSessionActive(currentSessionId || '') ? (
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

          {isActive && (
            <div className="text-center">
              <p className="text-lg font-medium">{sessionTitle}</p>
              <p className="text-sm text-muted-foreground">
                Cette session continue en arrière-plan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Historique des sessions de focus.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
