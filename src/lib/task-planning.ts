export interface PlannableTask {
  id: string;
  title: string;
  priority?: string | null;
  completed: boolean;
  due_date?: string | null;
  created_at?: string;
}
export function parisDateKey(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function taskDateKey(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : parisDateKey(date)
    : null;
}
export function formatTaskDate(value?: string | null): string {
  const key = taskDateKey(value);
  if (!key) return "Date non valide";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${key}T12:00:00Z`));
}
export function planTasks<T extends PlannableTask>(
  tasks: readonly T[],
  options: { status: string; search: string; sort: string; now?: Date },
): T[] {
  const today = parisDateKey(options.now || new Date());
  const weight: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const needle = options.search.trim().toLocaleLowerCase("fr");
  return tasks
    .filter((task) => {
      if (needle && !task.title.toLocaleLowerCase("fr").includes(needle))
        return false;
      if (options.status === "completed") return task.completed;
      if (task.completed) return options.status === "all";
      const due = taskDateKey(task.due_date);
      if (options.status === "today") return due === today;
      if (options.status === "overdue") return due !== null && due < today;
      return true;
    })
    .sort((a, b) => {
      if (options.sort === "recent")
        return (b.created_at || "").localeCompare(a.created_at || "");
      const aDue = taskDateKey(a.due_date) || "9999",
        bDue = taskDateKey(b.due_date) || "9999";
      const priority =
        (weight[a.priority || "medium"] ?? 1) -
        (weight[b.priority || "medium"] ?? 1);
      return options.sort === "priority"
        ? priority ||
            aDue.localeCompare(bDue) ||
            a.title.localeCompare(b.title, "fr")
        : aDue.localeCompare(bDue) ||
            priority ||
            a.title.localeCompare(b.title, "fr");
    });
}
