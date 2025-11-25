import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCalendarData } from "@/hooks/useCalendarData";
import { GoogleCalendarHeader } from "@/components/GoogleCalendarHeader";
import { GoogleCalendarView } from "@/components/GoogleCalendarView";
import { GoogleCalendarEventModal, EventFormData } from "@/components/GoogleCalendarEventModal";
import { AISuggestedEvents } from "@/components/AISuggestedEvents";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  const [initialEventData, setInitialEventData] = useState<any>(null);
  
  const { items: calendarItems, isLoading: isLoadingItems } = useCalendarData(selectedDate);

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
      startDate.setDate(startDate.getDate() - 7); // Start from a week before
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7); // End a week after

      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "list",
          user_id: user.id,
          time_min: startDate.toISOString(),
          time_max: endDate.toISOString(),
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calendar-ai-suggestions", {
        body: {
          userId: user.id,
          date: selectedDate.toISOString(),
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        // Extract error message from the error object
        if (error.context?.body) {
          try {
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              toast.error(errorBody.error);
              return;
            }
          } catch (e) {
            // If we can't parse the error body, continue with default error handling
          }
        }
        throw error;
      }

      if (data?.error) {
        console.error("Edge function returned error:", data.error);
        toast.error(data.error);
        return;
      }
      
      setSuggestedEvents(data.suggestedEvents || []);
      toast.success("Suggestions générées avec succès");
    } catch (error: any) {
      console.error("Error getting AI suggestions:", error);
      
      // Try to extract a meaningful error message
      let errorMessage = "Erreur lors de la récupération des suggestions";
      
      if (error?.context?.body) {
        try {
          const errorBody = JSON.parse(error.context.body);
          errorMessage = errorBody.error || errorMessage;
        } catch (e) {
          // Keep default message
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: EventFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const startDateTime = eventData.allDay 
        ? eventData.startDate
        : `${eventData.startDate}T${eventData.startTime}:00`;
      
      const endDateTime = eventData.allDay
        ? eventData.endDate
        : `${eventData.endDate}T${eventData.endTime}:00`;

      const googleEventData: any = {
        summary: eventData.title,
        description: eventData.description,
      };

      if (eventData.allDay) {
        googleEventData.start = { date: eventData.startDate };
        googleEventData.end = { date: eventData.endDate };
      } else {
        googleEventData.start = { dateTime: startDateTime, timeZone: eventData.timezone };
        googleEventData.end = { dateTime: endDateTime, timeZone: eventData.timezone };
      }

      if (eventData.location) {
        googleEventData.location = eventData.location;
      }

      const { error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "create",
          user_id: user.id,
          event_data: googleEventData,
        },
      });

      if (error) throw error;

      toast.success("Événement créé !");
      setIsCreateDialogOpen(false);
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erreur lors de la création de l'événement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEventFromCalendar = (date: Date, hour: number) => {
    const hourStr = hour.toString().padStart(2, '0');
    setInitialEventData({
      date,
      startTime: `${hourStr}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
    });
    setIsCreateDialogOpen(true);
  };

  const handleAddClick = () => {
    setInitialEventData({
      date: selectedDate,
      startTime: "13:00",
      endTime: "14:00",
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
              >
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
      ) : (
        <div className="flex flex-col h-full">
          <GoogleCalendarHeader
            currentDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
            }}
            userEmail={user?.email}
          />

          <div className="flex-1 overflow-hidden">
            <GoogleCalendarView
              currentDate={selectedDate}
              events={events}
              onCreateEvent={handleCreateEventFromCalendar}
              onAddClick={handleAddClick}
            />
          </div>

          {/* AI Suggestions below calendar */}
          <div className="border-t bg-background p-4 overflow-y-auto max-h-[300px]">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Suggestions IA</h3>
                <Button
                  onClick={getAISuggestions}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    "Générer des suggestions"
                  )}
                </Button>
              </div>
              
              {suggestedEvents.length > 0 && (
                <AISuggestedEvents
                  events={suggestedEvents}
                  onCreateEvent={async (event) => {
                    const eventData: EventFormData = {
                      title: event.title,
                      type: "event",
                      description: event.description || "",
                      calendar: "mon-agenda",
                      allDay: false,
                      startDate: event.startDateTime.split('T')[0],
                      startTime: event.startDateTime.split('T')[1]?.slice(0, 5) || "13:00",
                      endDate: event.endDateTime.split('T')[0],
                      endTime: event.endDateTime.split('T')[1]?.slice(0, 5) || "14:00",
                      timezone: "Europe/Paris",
                      repeat: "none",
                      guests: [],
                      location: "",
                      videoConference: false,
                    };
                    await createEvent(eventData);
                  }}
                />
              )}
            </div>
          </div>

          <GoogleCalendarEventModal
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSave={createEvent}
            initialData={initialEventData}
          />
        </div>
      )}
    </div>
  );
}
