
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface FocusSession {
  id?: string;
  title: string;
  duration: number;
  startTime: number;
  isActive: boolean;
}

export const FocusTimer = () => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Restaurer une session depuis localStorage au démarrage
    const savedSession = localStorage.getItem('focus_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      const elapsed = Date.now() - parsed.startTime;
      const remaining = parsed.duration * 60 * 1000 - elapsed;
      
      if (remaining > 0 && parsed.isActive) {
        setSession(parsed);
        setTimeLeft(Math.ceil(remaining / 1000));
        setIsVisible(true);
      } else {
        localStorage.removeItem('focus_session');
      }
    }

    // Écouter les messages pour démarrer une nouvelle session
    const handleFocusStart = (event: CustomEvent) => {
      const { title, duration } = event.detail;
      startSession(title, duration);
    };

    window.addEventListener('focus-start' as any, handleFocusStart);
    return () => window.removeEventListener('focus-start' as any, handleFocusStart);
  }, []);

  useEffect(() => {
    if (!session || !session.isActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    // Sauvegarder la session dans localStorage
    if (session) {
      localStorage.setItem('focus_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('focus_session');
    }
  }, [session]);

  const startSession = (title: string, duration: number) => {
    const newSession: FocusSession = {
      title,
      duration,
      startTime: Date.now(),
      isActive: true
    };
    
    setSession(newSession);
    setTimeLeft(duration * 60);
    setIsVisible(true);
    
    toast({
      title: "Session de focus démarrée",
      description: `${title} - ${duration} minutes`,
    });
  };

  const pauseSession = () => {
    if (!session) return;
    
    setSession(prev => prev ? { ...prev, isActive: false } : null);
    
    toast({
      title: "Session en pause",
      description: "Votre session de focus a été mise en pause.",
    });
  };

  const resumeSession = () => {
    if (!session) return;
    
    const newSession = {
      ...session,
      isActive: true,
      startTime: Date.now() - (session.duration * 60 * 1000 - timeLeft * 1000)
    };
    
    setSession(newSession);
    
    toast({
      title: "Session reprise",
      description: "Votre session de focus a été reprise.",
    });
  };

  const stopSession = async () => {
    if (!session || !user) return;

    try {
      // Sauvegarder en base de données
      const completedDuration = Math.max(0, session.duration * 60 - timeLeft);
      
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        title: session.title,
        duration: completedDuration,
        started_at: new Date(session.startTime).toISOString(),
        completed_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error saving focus session:', error);
    }

    setSession(null);
    setTimeLeft(0);
    setIsVisible(false);
    
    toast({
      title: "Session arrêtée",
      description: "Votre session de focus a été arrêtée.",
    });
  };

  const completeSession = async () => {
    if (!session || !user) return;

    try {
      // Sauvegarder en base de données
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        title: session.title,
        duration: session.duration * 60,
        started_at: new Date(session.startTime).toISOString(),
        completed_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error saving focus session:', error);
    }

    setSession(null);
    setTimeLeft(0);
    setIsVisible(false);
    
    // Notification de fin
    toast({
      title: "🎉 Session terminée !",
      description: `Félicitations ! Vous avez terminé votre session "${session.title}".`,
    });

    // Notification browser si permission accordée
    if (Notification.permission === 'granted') {
      new Notification('Session de focus terminée !', {
        body: `Vous avez terminé votre session "${session.title}".`,
        icon: '/icons/icon-192x192.png'
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !session) return null;

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
              onClick={() => setIsVisible(false)}
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
            {session.isActive ? (
              <Button size="sm" variant="outline" onClick={pauseSession}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button size="sm" onClick={resumeSession}>
                <Play className="h-4 w-4 mr-1" />
                Reprendre
              </Button>
            )}
            
            <Button size="sm" variant="destructive" onClick={stopSession}>
              <Square className="h-4 w-4 mr-1" />
              Arrêter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
