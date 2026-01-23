import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, eachDayOfInterval, startOfWeek } from "date-fns";

interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  activities: {
    habits: number;
    tasks: number;
    focus: number;
    journal: number;
  };
}

interface HeatmapResult {
  data: DayActivity[];
  totalActiveDays: number;
  longestStreak: number;
  currentStreak: number;
  totalActivities: number;
}

const getActivityLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
};

export const useConsistencyHeatmap = (days: number = 365) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['consistency-heatmap', user?.id, days],
    queryFn: async (): Promise<HeatmapResult> => {
      if (!user) {
        return {
          data: [],
          totalActiveDays: 0,
          longestStreak: 0,
          currentStreak: 0,
          totalActivities: 0
        };
      }

      try {
        const endDate = new Date();
        const startDate = subDays(endDate, days);
        const startDateStr = format(startDate, 'yyyy-MM-dd');

        // Fetch all activity data in parallel
        const [habitCompletions, tasks, focusSessions, journalEntries] = await Promise.all([
          supabase.from('habit_completions').select('completed_date').eq('user_id', user.id).gte('completed_date', startDateStr),
          supabase.from('tasks').select('updated_at').eq('user_id', user.id).eq('completed', true).gte('updated_at', startDate.toISOString()),
          supabase.from('focus_sessions').select('started_at').eq('user_id', user.id).gte('started_at', startDate.toISOString()),
          supabase.from('journal_entries').select('created_at').eq('user_id', user.id).gte('created_at', startDate.toISOString())
        ]);

        // Create a map for each day
        const activityMap: Record<string, { habits: number, tasks: number, focus: number, journal: number }> = {};

        // Initialize all days
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        allDays.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          activityMap[dateStr] = { habits: 0, tasks: 0, focus: 0, journal: 0 };
        });

        // Process habit completions
        (habitCompletions.data || []).forEach(c => {
          const dateStr = c.completed_date;
          if (activityMap[dateStr]) {
            activityMap[dateStr].habits++;
          }
        });

        // Process tasks
        (tasks.data || []).forEach(t => {
          if (t.updated_at) {
            const dateStr = format(new Date(t.updated_at), 'yyyy-MM-dd');
            if (activityMap[dateStr]) {
              activityMap[dateStr].tasks++;
            }
          }
        });

        // Process focus sessions
        (focusSessions.data || []).forEach(f => {
          if (f.started_at) {
            const dateStr = format(new Date(f.started_at), 'yyyy-MM-dd');
            if (activityMap[dateStr]) {
              activityMap[dateStr].focus++;
            }
          }
        });

        // Process journal entries
        (journalEntries.data || []).forEach(j => {
          if (j.created_at) {
            const dateStr = format(new Date(j.created_at), 'yyyy-MM-dd');
            if (activityMap[dateStr]) {
              activityMap[dateStr].journal++;
            }
          }
        });

        // Convert to array and calculate levels
        const data: DayActivity[] = allDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const activities = activityMap[dateStr];
          const count = activities.habits + activities.tasks + activities.focus + activities.journal;
          
          return {
            date: dateStr,
            count,
            level: getActivityLevel(count),
            activities
          };
        });

        // Calculate stats
        let totalActiveDays = 0;
        let longestStreak = 0;
        let currentStreak = 0;
        let tempStreak = 0;
        let totalActivities = 0;

        // Calculate from oldest to newest
        data.forEach((day, index) => {
          totalActivities += day.count;
          
          if (day.count > 0) {
            totalActiveDays++;
            tempStreak++;
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
          } else {
            tempStreak = 0;
          }
        });

        // Calculate current streak (from today backwards)
        for (let i = data.length - 1; i >= 0; i--) {
          if (data[i].count > 0) {
            currentStreak++;
          } else {
            break;
          }
        }

        return {
          data,
          totalActiveDays,
          longestStreak,
          currentStreak,
          totalActivities
        };

      } catch (error) {
        console.error('Error fetching heatmap data:', error);
        return {
          data: [],
          totalActiveDays: 0,
          longestStreak: 0,
          currentStreak: 0,
          totalActivities: 0
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
