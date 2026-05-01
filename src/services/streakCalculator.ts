
import { supabase } from "@/integrations/supabase/client";

type HabitSchedule = {
  id: string;
  days_of_week?: number[] | null;
};

type HabitCompletionRow = {
  habit_id: string;
  completed_date: string;
};

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getScheduledDays(daysOfWeek?: number[] | null): Set<number> | null {
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) {
    return null;
  }

  return new Set(daysOfWeek);
}

export function calculateStreakFromDates(
  completionDates: Iterable<string>,
  daysOfWeek?: number[] | null,
  baseDate: Date = new Date(),
): number {
  const completedSet = new Set(completionDates);
  if (completedSet.size === 0) return 0;

  const scheduledDays = getScheduledDays(daysOfWeek);
  const cursor = new Date(baseDate);
  cursor.setHours(0, 0, 0, 0);

  const isScheduledToday = !scheduledDays || scheduledDays.has(cursor.getDay());
  const todayKey = formatDateKey(cursor);

  if (isScheduledToday && !completedSet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  let remainingChecks = 366;

  while (remainingChecks > 0) {
    const dayOfWeek = cursor.getDay();
    const isScheduled = !scheduledDays || scheduledDays.has(dayOfWeek);

    if (isScheduled) {
      const dateKey = formatDateKey(cursor);
      if (!completedSet.has(dateKey)) break;
      streak += 1;
    }

    cursor.setDate(cursor.getDate() - 1);
    remainingChecks -= 1;
  }

  return streak;
}

export function calculateHabitStreakMap(
  habits: HabitSchedule[],
  completions: HabitCompletionRow[],
  baseDate: Date = new Date(),
): Record<string, number> {
  const completionMap = new Map<string, Set<string>>();

  completions.forEach(({ habit_id, completed_date }) => {
    const existing = completionMap.get(habit_id) ?? new Set<string>();
    existing.add(completed_date);
    completionMap.set(habit_id, existing);
  });

  return habits.reduce<Record<string, number>>((acc, habit) => {
    acc[habit.id] = calculateStreakFromDates(
      completionMap.get(habit.id) ?? [],
      habit.days_of_week,
      baseDate,
    );
    return acc;
  }, {});
}

export async function calculateStreak(
  habitId: string,
  userId: string,
  daysOfWeek?: number[] | null,
): Promise<number> {
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("completed_date")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .order("completed_date", { ascending: false })
    .limit(366);

  return calculateStreakFromDates(
    (completions ?? []).map((completion) => completion.completed_date),
    daysOfWeek,
  );
}
