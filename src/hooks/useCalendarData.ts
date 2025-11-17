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
      const targetDate = selectedDate.toISOString().split('T')[0];
      const selectedDay = selectedDate.getDay();

      // Charger les tâches avec date d'échéance
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', targetDate)
        .lte('due_date', targetDate + 'T23:59:59');

      // Charger les habitudes prévues pour ce jour
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false);

      // Charger les objectifs avec date cible
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('target_date', targetDate)
        .lte('target_date', targetDate + 'T23:59:59');

      const calendarItems: CalendarItem[] = [];

      // Ajouter les tâches
      tasks?.forEach((task: any) => {
        calendarItems.push({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          date: task.due_date || targetDate,
          type: 'task',
          completed: task.completed,
          priority: task.priority || undefined,
        });
      });

      // Ajouter les habitudes (seulement si prévues pour ce jour)
      habits?.forEach((habit: any) => {
        const shouldShow = !habit.days_of_week || 
                          habit.days_of_week.length === 0 || 
                          habit.days_of_week.includes(selectedDay);
        
        if (shouldShow) {
          calendarItems.push({
            id: habit.id,
            title: habit.title,
            description: habit.description || undefined,
            date: targetDate,
            type: 'habit',
            category: habit.category || undefined,
          });
        }
      });

      // Ajouter les objectifs
      goals?.forEach((goal: any) => {
        calendarItems.push({
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
          date: goal.target_date || targetDate,
          type: 'goal',
          completed: goal.completed,
          category: goal.category,
        });
      });

      setItems(calendarItems);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { items, isLoading, reload: loadCalendarData };
}
