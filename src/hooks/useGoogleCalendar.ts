import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setIsConnected(!!data);
  };

  const loadEvents = async (startDate: Date, endDate: Date) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "list",
          user_id: user.id,
          time_min: startDate.toISOString(),
          time_max: endDate.toISOString(),
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

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
  }) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "create",
          user_id: user.id,
          event_data: {
            summary: eventData.title,
            description: eventData.description,
            start: { dateTime: eventData.startDateTime, timeZone: "Europe/Paris" },
            end: { dateTime: eventData.endDateTime, timeZone: "Europe/Paris" },
          },
        },
      });

      if (error) throw error;
      toast.success("Événement créé !");
      return true;
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erreur de création de l'événement");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "delete",
          user_id: user.id,
          event_id: eventId,
        },
      });

      if (error) throw error;
      toast.success("Événement supprimé !");
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erreur de suppression de l'événement");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    events,
    isLoading,
    loadEvents,
    createEvent,
    deleteEvent,
    checkConnection,
  };
}
