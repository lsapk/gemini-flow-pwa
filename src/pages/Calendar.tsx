import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useCalendarData } from "@/hooks/useCalendarData";
import { AppleCalendarView } from "@/components/AppleCalendarView";
import { GoogleCalendarEventModal, EventFormData } from "@/components/GoogleCalendarEventModal";
import { AISuggestedEvents } from "@/components/AISuggestedEvents";
import { Markdown } from "@/components/Markdown";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export default function CalendarPage() {
  const { user, session, isLoading: isAuthLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  const [suggestionText, setSuggestionText] = useState<string>("");
  const [initialEventData, setInitialEventData] = useState<any>(null);

  const { items: calendarItems, isLoading: isLoadingItems } = useCalendarData(selectedDate);

  useEffect(() => {
    if (user && session && !isAuthLoading) checkConnection();
  }, [user, session, isAuthLoading]);

  useEffect(() => {
    if (isConnected && selectedDate && session && !isAuthLoading) loadEvents();
  }, [isConnected, selectedDate, session, isAuthLoading]);

  const checkConnection = async () => {
    if (!user) return;
    const { data } = await supabase.from("google_calendar_tokens").select("*").eq("user_id", user.id).single();
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
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch (error) {
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
          const { error } = await supabase.functions.invoke("google-calendar-oauth", { body: { code, user_id: user.id } });
          if (error) throw error;
          toast.success("Calendrier Google connecté !");
          setIsConnected(true);
          window.history.replaceState({}, document.title, "/calendar");
        } catch {
          toast.error("Erreur de connexion au calendrier");
        } finally {
          setIsConnecting(false);
        }
      }
    };
    handleCallback();
  }, [user]);

  const loadEvents = async () => {
    if (!user || !selectedDate || !session) return;
    setIsLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);

      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        body: { action: "list", time_min: startDate.toISOString(), time_max: endDate.toISOString() },
      });
      if (error) throw error;
      setEvents(data?.items || []);
    } catch {
      toast.error("Erreur lors du chargement des événements");
    } finally {
      setIsLoading(false);
    }
  };

  const getAISuggestions = async () => {
    if (!user || !selectedDate || !session) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calendar-ai-suggestions", {
        body: { date: selectedDate.toISOString() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setSuggestionText(data.suggestion || "");
      setSuggestedEvents(data.suggestedEvents || []);
      toast.success("Suggestions générées avec succès");
    } catch (error: any) {
      let errorMessage = "Erreur lors de la récupération des suggestions";
      if (error?.message) errorMessage = error.message;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: EventFormData) => {
    if (!user || !session) return;
    setIsLoading(true);
    try {
      const googleEventData: any = { summary: eventData.title, description: eventData.description };
      if (eventData.allDay) {
        googleEventData.start = { date: eventData.startDate };
        googleEventData.end = { date: eventData.endDate };
      } else {
        googleEventData.start = { dateTime: `${eventData.startDate}T${eventData.startTime}:00`, timeZone: eventData.timezone };
        googleEventData.end = { dateTime: `${eventData.endDate}T${eventData.endTime}:00`, timeZone: eventData.timezone };
      }
      if (eventData.location) googleEventData.location = eventData.location;

      const { error } = await supabase.functions.invoke("google-calendar-api", {
        body: { action: "create", event_data: googleEventData },
      });
      if (error) throw error;
      toast.success("Événement créé !");
      setIsCreateDialogOpen(false);
      loadEvents();
    } catch {
      toast.error("Erreur lors de la création de l'événement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEventFromCalendar = (date: Date, hour: number) => {
    const hourStr = hour.toString().padStart(2, "0");
    setInitialEventData({ date, startTime: `${hourStr}:00`, endTime: `${(hour + 1).toString().padStart(2, "0")}:00` });
    setIsCreateDialogOpen(true);
  };

  const handleAddClick = () => {
    setInitialEventData({ date: selectedDate, startTime: "13:00", endTime: "14:00" });
    setIsCreateDialogOpen(true);
  };

  const aiPanelContent = isConnected ? (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Intelligence IA</h3>
        <Button onClick={getAISuggestions} disabled={isLoading} size="sm" variant="outline" className="text-xs">
          {isLoading ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Génération...</> : "Générer des suggestions"}
        </Button>
      </div>
      {suggestionText && (
        <Card><CardContent className="pt-4"><Markdown content={suggestionText} /></CardContent></Card>
      )}
      {suggestedEvents.length > 0 && (
        <AISuggestedEvents
          events={suggestedEvents}
          onCreateEvent={async (event) => {
            await createEvent({
              title: event.title, type: "event", description: event.description || "",
              calendar: "mon-agenda", allDay: false,
              startDate: event.startDateTime.split("T")[0],
              startTime: event.startDateTime.split("T")[1]?.slice(0, 5) || "13:00",
              endDate: event.endDateTime.split("T")[0],
              endTime: event.endDateTime.split("T")[1]?.slice(0, 5) || "14:00",
              timezone: "Europe/Paris", repeat: "none", guests: [], location: "", videoConference: false,
            });
            loadEvents();
          }}
        />
      )}
    </div>
  ) : null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Banner if not connected to Google */}
      {!isConnected && (
        <div className="shrink-0 mx-2 mt-2 mb-1 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4 text-primary" />
            <span>Connectez Google Calendar pour synchroniser vos événements</span>
          </div>
          <Button onClick={connectGoogle} disabled={isConnecting} size="sm" variant="outline" className="text-xs shrink-0">
            {isConnecting ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Connexion...</> : "Connecter"}
          </Button>
        </div>
      )}

      <AppleCalendarView
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        googleEvents={isConnected ? events : []}
        localItems={calendarItems}
        onCreateEvent={isConnected ? handleCreateEventFromCalendar : undefined}
        onAddClick={isConnected ? handleAddClick : undefined}
        isLoading={isLoading || isLoadingItems}
        aiContent={aiPanelContent}
        showAI={isConnected}
      />

      {isConnected && (
        <GoogleCalendarEventModal
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSave={createEvent}
          initialData={initialEventData}
        />
      )}
    </div>
  );
}
