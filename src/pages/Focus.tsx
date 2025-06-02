
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimerIcon } from "@/components/icons/DeepFlowIcons";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Clock, RefreshCcw, Play, Pause, PlayCircle } from "lucide-react";

const Focus = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [progress, setProgress] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification, requestPermission } = useNotifications();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved session state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('deepflow-focus-session');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const now = new Date().getTime();
        const timePassed = Math.floor((now - state.lastUpdate) / 1000);
        
        if (state.isActive && !state.isPaused && state.sessionStartTime) {
          setIsActive(true);
          setIsPaused(false);
          setMode(state.mode);
          setFocusDuration(state.focusDuration);
          setBreakDuration(state.breakDuration);
          setSessionStartTime(new Date(state.sessionStartTime));
          setTotalSessionTime(state.totalSessionTime + timePassed);
          
          const newSecondsLeft = Math.max(0, state.secondsLeft - timePassed);
          setSecondsLeft(newSecondsLeft);
          
          if (newSecondsLeft === 0) {
            handleSessionComplete();
          }
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('deepflow-focus-session');
      }
    }
  }, []);

  // Save session state to localStorage
  const saveSessionState = useCallback(() => {
    if (isActive && sessionStartTime) {
      const state = {
        isActive,
        isPaused,
        mode,
        secondsLeft,
        focusDuration,
        breakDuration,
        sessionStartTime: sessionStartTime.toISOString(),
        totalSessionTime,
        lastUpdate: new Date().getTime()
      };
      localStorage.setItem('deepflow-focus-session', JSON.stringify(state));
    }
  }, [isActive, isPaused, mode, secondsLeft, focusDuration, breakDuration, sessionStartTime, totalSessionTime]);

  // Save state when component updates
  useEffect(() => {
    saveSessionState();
  }, [saveSessionState]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

  const handleSessionComplete = useCallback(() => {
    if (mode === "focus" && sessionStartTime) {
      const actualDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      saveFocusSession(actualDuration);
      setSessionsCompleted(prev => prev + 1);
      
      sendNotification('Temps de concentration terminé!', {
        body: "C'est l'heure de faire une pause!",
        tag: 'focus-complete'
      });
    } else if (mode === "break") {
      sendNotification('Pause terminée!', {
        body: "Prêt à reprendre le travail?",
        tag: 'break-complete'
      });
    }
    
    // Switch modes
    const nextMode = mode === "focus" ? "break" : "focus";
    const nextTime = nextMode === "focus" ? focusDuration * 60 : breakDuration * 60;
    setMode(nextMode);
    setSecondsLeft(nextTime);
    setIsPaused(true);
    setSessionStartTime(null);
    setTotalSessionTime(0);
    localStorage.removeItem('deepflow-focus-session');
  }, [mode, sessionStartTime, focusDuration, breakDuration, sendNotification]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((seconds) => {
          if (seconds <= 1) {
            handleSessionComplete();
            return 0;
          }
          return seconds - 1;
        });
        setTotalSessionTime(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, handleSessionComplete]);

  // Calculate progress
  useEffect(() => {
    const totalSeconds = mode === "focus" ? focusDuration * 60 : breakDuration * 60;
    setProgress(((totalSeconds - secondsLeft) / totalSeconds) * 100);
  }, [secondsLeft, mode, focusDuration, breakDuration]);

  // Save focus session to database (even if incomplete)
  const saveFocusSession = useCallback(async (duration?: number) => {
    if (!user || !sessionStartTime) return;
    
    try {
      const actualDuration = duration || totalSessionTime;
      
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          duration: actualDuration,
          title: `Session de focus de ${Math.floor(actualDuration / 60)} minutes`,
          completed_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Session enregistrée",
        description: `Session de ${formatTime(actualDuration)} sauvegardée avec succès.`,
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la session:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la session.",
        variant: "destructive"
      });
    }
  }, [user, sessionStartTime, totalSessionTime, toast]);

  // Update secondsLeft when focus or break duration changes
  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(mode === "focus" ? focusDuration * 60 : breakDuration * 60);
    }
  }, [focusDuration, breakDuration, mode, isActive]);

  const startTimer = () => {
    if (!isActive || isPaused) {
      if (!sessionStartTime && mode === "focus") {
        setSessionStartTime(new Date());
        setTotalSessionTime(0);
      }
      setIsActive(true);
      setIsPaused(false);
      
      // Send notification when starting
      sendNotification(`${mode === "focus" ? "Session de concentration" : "Pause"} démarrée`, {
        body: `${formatTime(secondsLeft)} restantes`,
        tag: 'session-start'
      });
    }
  };

  const pauseTimer = () => {
    setIsPaused(true);
    // Save session when paused (even if incomplete)
    if (mode === "focus" && sessionStartTime && totalSessionTime > 0) {
      saveFocusSession();
    }
  };

  const resetTimer = () => {
    // Save session before reset (even if incomplete)
    if (mode === "focus" && sessionStartTime && totalSessionTime > 0) {
      saveFocusSession();
    }
    
    setIsActive(false);
    setIsPaused(true);
    setMode("focus");
    setSecondsLeft(focusDuration * 60);
    setSessionStartTime(null);
    setTotalSessionTime(0);
    localStorage.removeItem('deepflow-focus-session');
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TimerIcon className="h-8 w-8" />
          Mode Focus
        </h1>
        <p className="text-muted-foreground">
          Utilisez la technique Pomodoro pour rester concentré et productif.
        </p>
      </div>

      <Card className="glass-card mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === "focus" ? "Temps de travail" : "Pause"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "focus"
              ? "Concentrez-vous sur votre tâche"
              : "Prenez une courte pause"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  strokeWidth="8"
                  stroke="currentColor"
                  className="text-primary"
                  strokeDasharray="552.9"
                  strokeDashoffset={552.9 - (progress / 100) * 552.9}
                />
              </svg>
              <span className="text-4xl font-bold">{formatTime(secondsLeft)}</span>
            </div>
          </div>

          {!isActive && (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Durée de concentration:</label>
                  <span className="text-sm font-bold">{focusDuration} min</span>
                </div>
                <Select
                  value={focusDuration.toString()}
                  onValueChange={(value) => setFocusDuration(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Durée de concentration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Durée de pause:</label>
                  <span className="text-sm font-bold">{breakDuration} min</span>
                </div>
                <Select
                  value={breakDuration.toString()}
                  onValueChange={(value) => setBreakDuration(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Durée de pause" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4 pt-4">
            {isPaused ? (
              <Button onClick={startTimer} size="lg" className="flex items-center gap-2">
                {isActive ? <Play className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                {isActive ? "Reprendre" : "Démarrer"}
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="outline" size="lg" className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            <Button onClick={resetTimer} variant="outline" size="lg" className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
          
          {sessionsCompleted > 0 && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Sessions complétées aujourd'hui: <span className="font-bold text-primary">{sessionsCompleted}</span>
              </p>
            </div>
          )}

          {isActive && sessionStartTime && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Temps total: <span className="font-bold">{formatTime(totalSessionTime)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Focus;
