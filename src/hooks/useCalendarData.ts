import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: "task" | "habit" | "goal" | "google_event";
  completed?: boolean;
  priority?: string;
  category?: string;
  source?: "local" | "google";
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function calendarWeek(selectedDate: Date) {
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function useCalendarData(selectedDate: Date) {
  const { user } = useAuth();
  const { start, end } = calendarWeek(selectedDate);
  const first = localDay(start),
    last = localDay(end);
  const query = useQuery({
    queryKey: ["calendar-local", user?.id, first, last],
    enabled: Boolean(user),
    queryFn: async () => {
      const tasks: CalendarItem[] = [],
        goals: CalendarItem[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase
          .from("tasks")
          .select("id,title,description,due_date,completed")
          .eq("user_id", user!.id)
          .gte("due_date", first)
          .lt("due_date", last)
          .order("id")
          .range(offset, offset + 499);
        if (error)
          throw new Error(
            "Vos échéances ne peuvent pas être chargées. Réessayez.",
          );
        tasks.push(
          ...(data || []).map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description || undefined,
            date: task.due_date!,
            completed: task.completed,
            type: "task" as const,
            source: "local" as const,
          })),
        );
        if (!data || data.length < 500) break;
      }
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase
          .from("goals")
          .select("id,title,description,target_date,completed")
          .eq("user_id", user!.id)
          .gte("target_date", first)
          .lt("target_date", last)
          .order("id")
          .range(offset, offset + 499);
        if (error)
          throw new Error(
            "Vos objectifs ne peuvent pas être chargés. Réessayez.",
          );
        goals.push(
          ...(data || []).map((goal) => ({
            id: goal.id,
            title: goal.title,
            description: goal.description || undefined,
            date: goal.target_date!,
            completed: goal.completed,
            type: "goal" as const,
            source: "local" as const,
          })),
        );
        if (!data || data.length < 500) break;
      }
      return [...tasks, ...goals].sort((a, b) => a.date.localeCompare(b.date));
    },
    retry: false,
  });
  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  };
}
