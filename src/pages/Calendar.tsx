import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCalendarData } from "@/hooks/useCalendarData";
import { ProfessionalWeekCalendar } from "@/components/ProfessionalWeekCalendar";
import { AISuggestedEvents } from "@/components/AISuggestedEvents";
import { marked } from "marked";

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
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  
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
      const startDate = new Date(selectedDate);
      startDate.setDate(1);
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "list",
          user_id: user.id,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
        },
      });

      if (error) throw error;

      setEvents(data?.items || []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Erreur lors du chargement des événements");
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
      
      setAiSuggestion(data.suggestion || "");
      setSuggestedEvents(data.suggestedEvents || []);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast.error("Erreur lors de la récupération des suggestions");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const createEvent = async (eventData?: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
  }) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const finalEventData = eventData || {
        title: newEvent.title,
        description: newEvent.description,
        startDateTime: `${format(selectedDate!, 'yyyy-MM-dd')}T${newEvent.startTime}:00`,
        endDateTime: `${format(selectedDate!, 'yyyy-MM-dd')}T${newEvent.endTime}:00`,
      };

      const { error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "create",
          user_id: user.id,
          eventData: finalEventData,
        },
      });

      if (error) throw error;

      toast.success("Événement créé !");
      setIsCreateDialogOpen(false);
      setNewEvent({ title: "", description: "", startTime: "", endTime: "" });
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erreur lors de la création de l'événement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEventFromCalendar = (date: Date, hour: number) => {
    setSelectedDate(date);
    const hourStr = hour.toString().padStart(2, '0');
    setNewEvent({
      title: "",
      description: "",
      startTime: `${hourStr}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Calendrier Google
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Connectez votre compte Google pour synchroniser vos événements et obtenir des suggestions personnalisées.
              </p>
              <Button 
                onClick={connectGoogle} 
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Connecter Google Calendar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Main Calendar */}
          <div className="flex-1 overflow-hidden">
            <ProfessionalWeekCalendar
              items={calendarItems}
              selectedDate={selectedDate || new Date()}
              onDateChange={setSelectedDate}
              onCreateEvent={handleCreateEventFromCalendar}
            />
          </div>

          {/* AI Sidebar */}
          <div className="w-80 space-y-4 overflow-y-auto">
            {/* AI Suggestions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Suggestions IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : aiSuggestion ? (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: marked(aiSuggestion) }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur "Obtenir des suggestions" pour recevoir des recommandations personnalisées.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Suggested Events */}
            {suggestedEvents.length > 0 && (
              <AISuggestedEvents
                events={suggestedEvents}
                onCreateEvent={createEvent}
              />
            )}

            <Button 
              onClick={getAISuggestions} 
              disabled={isLoadingAI}
              className="w-full"
              variant="outline"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Obtenir des suggestions
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Create Event Dialog */}
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
            <Button onClick={() => createEvent()} disabled={isLoading || !newEvent.title} className="w-full">
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
