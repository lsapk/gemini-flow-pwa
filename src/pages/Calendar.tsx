import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCalendarData } from "@/hooks/useCalendarData";
import { WeekCalendarView } from "@/components/WeekCalendarView";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const { items: calendarItems, isLoading: isLoadingItems } = useCalendarData(selectedDate || new Date());
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    checkConnection();
  }, [user]);

  useEffect(() => {
    if (isConnected && selectedDate) {
      loadEvents();
    }
  }, [isConnected, selectedDate]);

  const checkConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setIsConnected(!!data);
  };

  const connectGoogle = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth", {
        body: { action: "get_auth_url", user_id: user.id },
      });

      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error getting auth URL:", error);
      toast.error("Erreur lors de la connexion");
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (code && state && user && state === user.id) {
        setIsConnecting(true);
        try {
          const { error } = await supabase.functions.invoke("google-calendar-oauth", {
            body: { code, user_id: user.id },
          });

          if (error) throw error;

          toast.success("Calendrier Google connecté !");
          setIsConnected(true);
          window.history.replaceState({}, document.title, "/calendar");
        } catch (error) {
          console.error("OAuth error:", error);
          toast.error("Erreur de connexion au calendrier");
        } finally {
          setIsConnecting(false);
        }
      }
    };

    handleCallback();
  }, [user]);

  const loadEvents = async () => {
    if (!user || !selectedDate) return;

    setIsLoading(true);
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "list",
          user_id: user.id,
          time_min: startOfMonth.toISOString(),
          time_max: endOfMonth.toISOString(),
        },
      });

      if (error) throw error;
      setEvents(data.items || []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Erreur de chargement des événements");
    } finally {
      setIsLoading(false);
    }
  };

  const getAISuggestions = async () => {
    if (!user || !selectedDate) return;

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("calendar-ai-suggestions", {
        body: {
          userId: user.id,
          date: selectedDate.toISOString(),
        },
      });

      if (error) throw error;
      setAiSuggestion(data.suggestion);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast.error("Erreur lors de la génération des suggestions");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const createEvent = async () => {
    if (!user || !selectedDate) return;

    setIsLoading(true);
    try {
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = newEvent.startTime.split(":");
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = newEvent.endTime.split(":");
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      const { error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "create",
          user_id: user.id,
          event_data: {
            summary: newEvent.title,
            description: newEvent.description,
            start: { dateTime: startDateTime.toISOString(), timeZone: "Europe/Paris" },
            end: { dateTime: endDateTime.toISOString(), timeZone: "Europe/Paris" },
          },
        },
      });

      if (error) throw error;

      toast.success("Événement créé !");
      setIsCreateDialogOpen(false);
      setNewEvent({ title: "", description: "", startTime: "", endTime: "" });
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erreur de création de l'événement");
    } finally {
      setIsLoading(false);
    }
  };

  const dayEvents = events.filter((event) => {
    if (!selectedDate) return false;
    const eventDate = new Date(event.start.dateTime || event.start.date || "");
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connectez votre Google Calendar</h3>
            <p className="text-muted-foreground mb-6">
              Synchronisez vos événements et laissez l'IA gérer votre calendrier
            </p>
            <Button onClick={connectGoogle} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Connecter Google Calendar"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-8 w-8" />
          Calendrier
        </h1>
        <div className="flex gap-2">
          <Button onClick={getAISuggestions} disabled={isLoadingAI} variant="outline">
            {isLoadingAI ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Suggestions IA
              </>
            )}
          </Button>
          {!isConnected && (
            <Button onClick={connectGoogle} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Connecter Google Calendar"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <WeekCalendarView
          items={calendarItems}
          selectedDate={selectedDate || new Date()}
          onDateChange={setSelectedDate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiSuggestion && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Suggestions IA pour optimiser votre semaine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-sm">{aiSuggestion}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isConnected && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Événements Google Calendar</CardTitle>
                  <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : dayEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun événement Google Calendar
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <h3 className="font-medium">{event.summary}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {event.start.dateTime
                            ? new Date(event.start.dateTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : "Toute la journée"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Titre de l'événement"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Description (optionnel)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={createEvent} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'événement"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
