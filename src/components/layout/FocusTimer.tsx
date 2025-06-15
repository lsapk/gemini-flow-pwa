
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, Timer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActiveFocusSession {
  id: string;
  title: string;
  duration: number; // in minutes
  startTime: number; // timestamp
  userId: string;
  isActive: boolean; // Add isActive to sync pause state
  timeLeft?: number; // Add timeLeft to sync pause state
}

export const FocusTimer = () => {
  const [session, setSession] = useState<ActiveFocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const loadSession = () => {
    const savedSession = localStorage.getItem('active_focus_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as ActiveFocusSession;
        if (parsed.startTime && parsed.duration) {
          const elapsed = (Date.now() - parsed.startTime) / 1000;
          const remaining = parsed.duration * 60 - elapsed;
          
          if (remaining > 0) {
            setSession(parsed);
            if (parsed.isActive) {
              setTimeLeft(Math.ceil(remaining));
            } else {
              // If paused, we need to load the timeLeft saved by the main Focus page.
              // This part is tricky without a single source of truth. We'll approximate.
              // The main Focus page needs to save timeLeft on pause. Let's assume it does.
              setTimeLeft(parsed.timeLeft || Math.ceil(remaining));
            }
          } else {
            localStorage.removeItem('active_focus_session');
            setSession(null);
          }
        } else {
           localStorage.removeItem('active_focus_session');
           setSession(null);
        }
      } catch (e) {
        console.error("Failed to parse focus session", e);
        localStorage.removeItem('active_focus_session');
        setSession(null);
      }
    } else {
      setSession(null);
    }
  };

  useEffect(() => {
    loadSession();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'active_focus_session') {
        loadSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadSession, 2000); // Check for session periodically

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval> | undefined;
    if (session && session.isActive) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Session Focus</span>
              <Badge variant={session.isActive ? "default" : "secondary"}>
                {session.isActive ? "Active" : "Pause"}
              </Badge>
            </div>
             <Button
              variant="ghost"
              size="sm"
              onClick={() => setSession(null)} // Hide locally
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          
          <div className="text-center mb-3">
            <h3 className="font-semibold text-sm mb-1">{session.title}</h3>
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button size="sm" variant="destructive" disabled>
                      <Square className="h-4 w-4 mr-1" />
                      Arrêter
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Contrôlez la session depuis la page Focus.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
