import React from "react";
import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, Link2, Sparkles, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCalendarData } from "@/hooks/useCalendarData";
import { AppleCalendarView } from "@/components/AppleCalendarView";
import { GoogleCalendarEventModal, EventFormData } from "@/components/GoogleCalendarEventModal";
import { AISuggestedEvents } from "@/components/AISuggestedEvents";
import { Markdown } from "@/components/Markdown";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isAISuggestionsExpanded, setIsAISuggestionsExpanded] = useState(true);

  const { items: calendarItems, isLoading: isLoadingItems } = useCalendarData(selectedDate);

  useEffect(() => {
    if (user && session && !isAuthLoading) checkConnection();
  }, [user, session, isAuthLoading]);

  useEffect(() => {
    if (isConnected && selectedDate && session && !isAuthLoading) loadEvents();
  }, [isConnected, selectedDate, session, isAuthLoading]);

  const checkConnection = async () => {
    if (!user) return;
    const { data } = await supabase.from("google_calendar_tokens_safe").select("*").eq("user_id", user.id).maybeSingle();
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
      const cleanedSuggestion = (data.suggestion || "").replace(/```json[\s\S]*?```/g, "").trim();
      setSuggestionText(cleanedSuggestion);
      setSuggestedEvents(data.suggestedEvents || []);
      toast.success("Suggestions générées avec succès");
      setIsAISuggestionsExpanded(true);
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

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden bg-background/50">
      {/* Banner if not connected to Google */}
      {!isConnected && (
        <div className="shrink-0 mx-4 mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-md">
          <div className="flex items-center gap-3 text-sm font-medium">
            <div className="p-2 rounded-xl bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <span>Connectez Google Calendar pour synchroniser vos événements</span>
          </div>
          <Button onClick={connectGoogle} disabled={isConnecting} size="sm" variant="outline" className="rounded-xl font-bold active:scale-95 transition-transform">
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connecter"}
          </Button>
        </div>
      )}

      {/* AI Suggestions - Main Block */}
      {isConnected && (
        <div className="p-4 shrink-0">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2rem]">
            <CardHeader className="py-4 px-6 border-b border-primary/10 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 animate-glow-pulse">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading tracking-tight">Optimisation IA</CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">Suggestions personnalisées pour votre agenda</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={getAISuggestions}
                  disabled={isLoading}
                  size="sm"
                  className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Brain className="h-4 w-4 mr-2" /> Analyser</>}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAISuggestionsExpanded(!isAISuggestionsExpanded)}
                  className="rounded-xl"
                >
                  {isAISuggestionsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {isAISuggestionsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <CardContent className="p-0 max-h-[400px] overflow-y-auto scrollbar-none">
                    {!suggestionText && !suggestedEvents.length && !isLoading && (
                      <div className="p-10 text-center flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-[2rem] bg-secondary/30 flex items-center justify-center mb-2">
                          <Brain className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium max-w-[240px]">
                          L'IA peut organiser votre journée en fonction de vos tâches et habitudes.
                        </p>
                      </div>
                    )}

                    {suggestionText && (
                      <div className="p-6 border-b border-primary/5 bg-primary/[0.02]">
                        <Markdown content={suggestionText} />
                      </div>
                    )}

                    {suggestedEvents.length > 0 && (
                      <div className="p-4">
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
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      )}

      {/* Calendar View */}
      <div className="flex-1 min-h-0 relative">
        <AppleCalendarView
          currentDate={selectedDate}
          onDateChange={setSelectedDate}
          googleEvents={isConnected ? events : []}
          localItems={calendarItems}
          onCreateEvent={isConnected ? handleCreateEventFromCalendar : undefined}
          onAddClick={isConnected ? handleAddClick : undefined}
          isLoading={isLoading || isLoadingItems}
          showAI={false}
        />
      </div>

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
