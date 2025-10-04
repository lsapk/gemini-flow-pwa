import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Loader2 } from "lucide-react";
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

  const connectGoogle = () => {
    if (!user) return;

    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    const REDIRECT_URI = `${window.location.origin}/calendar`;
    const SCOPE = "https://www.googleapis.com/auth/calendar";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(SCOPE)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${user.id}`;

    window.location.href = authUrl;
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendrier</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "d MMMM yyyy") : "Sélectionnez une date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : dayEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun événement pour cette date
              </p>
            ) : (
              <div className="space-y-4">
                {dayEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{event.summary}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {event.start.dateTime
                        ? format(new Date(event.start.dateTime), "HH:mm")
                        : "Toute la journée"}
                      {event.end.dateTime && ` - ${format(new Date(event.end.dateTime), "HH:mm")}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
