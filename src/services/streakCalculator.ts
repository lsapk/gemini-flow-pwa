
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculate the real streak for a habit based on consecutive completions.
 * For habits with days_of_week, only counts scheduled days.
 */
export async function calculateStreak(
  habitId: string,
  userId: string,
  daysOfWeek?: number[] | null
): Promise<number> {
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('completed_date')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .order('completed_date', { ascending: false })
    .limit(365);

  if (!completions || completions.length === 0) return 0;

  const completedSet = new Set(completions.map(c => c.completed_date));
  const hasSpecificDays = daysOfWeek && daysOfWeek.length > 0 && daysOfWeek.length < 7;
  const scheduledDays = new Set(daysOfWeek || []);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start checking from today backward
  const checkDate = new Date(today);
  const todayStr = formatDate(checkDate);

  // If today is a scheduled day and not yet completed, check if yesterday was completed
  // (streak is still active if they haven't missed a scheduled day)
  const todayIsScheduled = !hasSpecificDays || scheduledDays.has(checkDate.getDay());

  if (todayIsScheduled && !completedSet.has(todayStr)) {
    // Today isn't done yet, so start from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive scheduled days that were completed
  let maxLookback = 365;
  while (maxLookback > 0) {
    const dateStr = formatDate(checkDate);
    const dayOfWeek = checkDate.getDay();
    const isScheduled = !hasSpecificDays || scheduledDays.has(dayOfWeek);

    if (isScheduled) {
      if (completedSet.has(dateStr)) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
    maxLookback--;
  }

  return streak;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
