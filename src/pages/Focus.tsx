
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Timer, Play, Pause, Square, Coffee } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FocusSession {
  id: string;
  title: string;
  duration: number;
  started_at: string;
  completed_at?: string;
}

export default function Focus() {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(25);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les sessions de focus
  const { data: sessions = [] } = useQuery({
    queryKey: ['focusSessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const createSessionMutation = useMutation({
    mutationFn: async (data: { title: string; duration: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: session, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          title: data.title,
          duration: data.duration,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return session;
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      setTimeLeft(session.duration * 60);
      setIsRunning(true);
      queryClient.invalidateQueries({ queryKey: ['focusSessions'] });
      toast({
        title: "Session démarrée",
        description: `Session "${session.title}" de ${session.duration} minutes`,
      });
    }
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('focus_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusSessions'] });
      toast({
        title: "Session terminée !",
        description: "Félicitations, vous avez terminé votre session de focus !",
      });
    }
  });

  const startSession = () => {
    if (!sessionTitle.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez entrer un titre pour votre session",
        variant: "destructive",
      });
      return;
    }
    
    createSessionMutation.mutate({
      title: sessionTitle.trim(),
      duration: selectedDuration
    });
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const stopSession = () => {
    if (currentSession) {
      completeSessionMutation.mutate(currentSession.id);
    }
    setCurrentSession(null);
    setTimeLeft(0);
    setIsRunning(false);
    setSessionTitle("");
  };

  const completeSession = () => {
    if (currentSession) {
      completeSessionMutation.mutate(currentSession.id);
    }
    setCurrentSession(null);
    setIsRunning(false);
    setSessionTitle("");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const durations = [15, 25, 45, 60, 90];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Timer className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Mode Focus</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer principal */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-center">
              {currentSession ? currentSession.title : "Nouvelle session"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Affichage du timer */}
            <div className="text-center">
              <div className="text-6xl font-mono font-bold mb-4">
                {formatTime(timeLeft)}
              </div>
              
              {currentSession && (
                <Badge variant="secondary" className="mb-4">
                  Session de {currentSession.duration} minutes
                </Badge>
              )}
            </div>

            {/* Configuration de session */}
            {!currentSession && (
              <div className="space-y-4">
                <Input
                  placeholder="Titre de la session (ex: Travail sur le projet)"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Durée (minutes)</label>
                  <div className="flex gap-2 flex-wrap">
                    {durations.map((duration) => (
                      <Button
                        key={duration}
                        variant={selectedDuration === duration ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDuration(duration)}
                      >
                        {duration}min
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contrôles */}
            <div className="flex justify-center gap-2">
              {!currentSession ? (
                <Button
                  onClick={startSession}
                  disabled={createSessionMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Démarrer
                </Button>
              ) : (
                <>
                  {isRunning ? (
                    <Button
                      onClick={pauseSession}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={resumeSession}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Reprendre
                    </Button>
                  )}
                  
                  <Button
                    onClick={stopSession}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Arrêter
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historique des sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune session enregistrée
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.started_at).toLocaleDateString()} •{" "}
                        {session.duration} minutes
                      </p>
                    </div>
                    <Badge
                      variant={session.completed_at ? "default" : "secondary"}
                    >
                      {session.completed_at ? "Terminée" : "En cours"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conseils */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Conseils pour une session productive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Éliminez toutes les distractions (notifications, réseaux sociaux)</li>
            <li>• Définissez un objectif clair pour votre session</li>
            <li>• Prenez une pause de 5 minutes toutes les 25 minutes (technique Pomodoro)</li>
            <li>• Hydratez-vous et gardez une posture correcte</li>
            <li>• Récompensez-vous après chaque session terminée</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
