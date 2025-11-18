import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Task, Habit, Goal } from "@/types";

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'task' | 'habit' | 'goal' | 'google_event';
  completed?: boolean;
  priority?: string;
  category?: string;
  source?: 'local' | 'google';
}

export function useCalendarData(selectedDate: Date) {
  const { user } = useAuth();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && selectedDate) {
      loadCalendarData();
    }
  }, [user, selectedDate]);

  const loadCalendarData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Calculate week range
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      endOfWeek.setHours(23, 59, 59, 999);

      // Charger les tâches pour toute la semaine
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startOfWeek.toISOString())
        .lte('due_date', endOfWeek.toISOString());

      // Charger les objectifs pour toute la semaine
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('target_date', startOfWeek.toISOString())
        .lte('target_date', endOfWeek.toISOString());

      // Charger les événements Google Calendar
      const googleEvents = await loadGoogleEvents(startOfWeek, endOfWeek);

      const calendarItems: CalendarItem[] = [];

      // Ajouter les tâches
      tasks?.forEach((task: any) => {
        calendarItems.push({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          date: task.due_date,
          type: 'task',
          completed: task.completed,
          priority: task.priority || undefined,
          source: 'local'
        });
      });

      // Ajouter les objectifs
      goals?.forEach((goal: any) => {
        calendarItems.push({
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
          date: goal.target_date,
          type: 'goal',
          completed: goal.completed,
          category: goal.category,
          source: 'local'
        });
      });

      // Ajouter les événements Google
      calendarItems.push(...googleEvents);

      setItems(calendarItems);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleEvents = async (startDate: Date, endDate: Date): Promise<CalendarItem[]> => {
    if (!user) return [];
    
    try {
      // Vérifier si Google Calendar est connecté
      const { data: tokenData } = await supabase
        .from("google_calendar_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!tokenData) return [];

      const { data: eventsData, error } = await supabase.functions.invoke("google-calendar-api", {
        body: {
          action: "list",
          user_id: user.id,
          time_min: startDate.toISOString(),
          time_max: endDate.toISOString(),
        },
      });

      if (error) {
        console.error("Error fetching Google events:", error);
        return [];
      }

      return (eventsData?.items || []).map((event: any) => ({
        id: event.id,
        title: event.summary || 'Sans titre',
        date: event.start?.dateTime || event.start?.date,
        type: 'google_event' as const,
        completed: false,
        description: event.description,
        source: 'google' as const
      }));
    } catch (error) {
      console.error("Error loading Google events:", error);
      return [];
    }
  };

  return { items, isLoading, reload: loadCalendarData };
}
