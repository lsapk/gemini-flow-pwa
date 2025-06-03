
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Play, Target, TrendingUp, Calendar } from "lucide-react";

export default function Focus() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(25);
  const { user } = useAuth();
  const { toast } = useToast();

  const presetSessions = [
    { name: "Pomodoro", duration: 25 },
    { name: "Travail intense", duration: 45 },
    { name: "Étude approfondie", duration: 60 },
    { name: "Sprint court", duration: 15 },
    { name: "Session longue", duration: 90 }
  ];

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading focus sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startFocusSession = () => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un titre pour votre session.",
        variant: "destructive",
      });
      return;
    }

    // Déclencher l'événement pour le timer global
    window.dispatchEvent(new CustomEvent('focus-start', {
      detail: { title: title.trim(), duration }
    }));

    // Réinitialiser le formulaire
    setTitle("");
    setDuration(25);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  const totalFocusTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
  const completedSessions = sessions.filter(s => s.completed_at).length;
  const averageSession = sessions.length > 0 ? Math.round(totalFocusTime / sessions.length / 60) : 0;

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6" />
        <h1 className="text-2xl sm:text-3xl font-bold">Mode Focus</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps total</p>
                <p className="text-2xl font-bold">{formatDuration(totalFocusTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{completedSessions}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne</p>
                <p className="text-2xl font-bold">{averageSession}min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Démarrer une session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Nouvelle session de focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de la session</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sur quoi allez-vous vous concentrer ?"
            />
          </div>

          <div>
            <Label htmlFor="duration">Durée (minutes)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="duration"
                type="number"
                min="1"
                max="180"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 25)}
                className="w-24"
              />
              <div className="flex flex-wrap gap-2">
                {presetSessions.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={duration === preset.duration ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration(preset.duration)}
                  >
                    {preset.name} ({preset.duration}min)
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={startFocusSession} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Commencer la session ({duration} min)
          </Button>
        </CardContent>
      </Card>

      {/* Historique des sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique récent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Aucune session enregistrée</p>
              <p className="text-muted-foreground">
                Commencez votre première session de focus pour améliorer votre productivité.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString('fr', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(session.duration || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.completed_at ? 'Terminée' : 'Interrompue'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
