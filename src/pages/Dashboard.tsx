import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  Circle,
  Clock3,
  GraduationCap,
  Plus,
  Repeat2,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { parisDateKey, planTasks, taskDateKey } from "@/lib/task-planning";
import { readAllPages } from "@/lib/pagination";

export interface OverviewTask {
  id: string;
  title: string;
  priority: string | null;
  due_date: string | null;
  completed: boolean;
}
export interface OverviewData {
  tasks: OverviewTask[];
  focusMinutes: number;
  habitCount: number;
  week: number[];
}
export const emptyOverview: OverviewData = {
  tasks: [],
  focusMinutes: 0,
  habitCount: 0,
  week: [0, 0, 0, 0, 0, 0, 0],
};
const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

function OverviewShortcuts() {
  const shortcuts = [
    { to: "/goals", label: "Objectifs", icon: Target },
    { to: "/habits", label: "Habitudes", icon: Repeat2 },
    { to: "/ai-assistant", label: "Assistant IA", icon: Sparkles },
  ];
  return (
    <nav aria-labelledby="overview-shortcuts">
      <h2 id="overview-shortcuts" className="mb-3 text-sm font-semibold">
        Raccourcis
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            asChild
            variant="outline"
            className="h-12 justify-start gap-3 bg-card px-4"
          >
            <Link to={to}>
              <Icon
                size={17}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              {label}
              <ArrowUpRight
                size={14}
                className="ml-auto text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
export function DashboardView({
  data,
  name,
  preview = false,
  onToggle,
}: {
  data: OverviewData;
  name: string;
  preview?: boolean;
  onToggle?: (task: OverviewTask) => void;
}) {
  const today = parisDateKey(new Date());
  const pending = planTasks(data.tasks, {
    status: "pending",
    search: "",
    sort: "due",
  });
  const completed = data.tasks.length - pending.length;
  const urgent = pending.filter((task) => {
    const due = taskDateKey(task.due_date);
    return due !== null && due <= today;
  });
  const visible = pending.slice(0, 4);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return new Intl.DateTimeFormat("fr-FR", { weekday: "narrow" }).format(date);
  });
  const max = Math.max(30, ...data.week);
  const mainLink = preview ? "/register" : "/tasks";
  return (
    <div className="space-y-7">
      {preview && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs">
          <span>
            Aperçu du design · données illustratives, aucune donnée de compte.
          </span>
          <Link to="/register" className="font-semibold text-primary">
            Créer mon espace →
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">{dateLabel(new Date())}</p>
          <h1 className="page-title">
            Bonjour {name}
            <span className="font-normal text-primary">.</span>
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Faites de la place pour ce qui compte aujourd’hui.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-xl text-xs shadow-sm">
          <Link to={preview ? mainLink : "/tasks?new=1"}>
            <Plus size={15} />
            Nouvelle tâche
          </Link>
        </Button>
      </div>
      <OverviewShortcuts />
      <section
        aria-label="Vos indicateurs"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            icon: CheckCheck,
            label: "Tâches terminées",
            value: completed,
            note: `sur ${data.tasks.length} tâches`,
            color:
              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            icon: Timer,
            label: "Temps de concentration",
            value: `${Math.floor(data.focusMinutes / 60)}h ${data.focusMinutes % 60}`,
            note: "sur les 7 derniers jours",
            color: "bg-primary/10 text-primary",
          },
          {
            icon: CalendarDays,
            label: "À traiter aujourd’hui",
            value: urgent.length,
            note: "échéances et retards",
            color:
              "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            icon: Circle,
            label: "Habitudes actives",
            value: data.habitCount,
            note: "pour garder votre rythme",
            color:
              "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
          },
        ].map((item) => (
          <article key={item.label} className="panel p-4 md:p-5">
            <div className="mb-5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                {item.label}
              </span>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${item.color}`}
              >
                <item.icon size={14} strokeWidth={1.7} aria-hidden="true" />
              </span>
            </div>
            <div className="stat-value">
              {item.value}
              <span className="sr-only"> {item.label}</span>
            </div>
            <p className="mt-2.5 text-[10px] text-muted-foreground">
              {item.note}
            </p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <section className="panel min-w-0">
          <div className="panel-heading">
            <h2 className="text-sm font-semibold">
              Votre prochain pas
              <span className="ml-2.5 rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                {pending.length}
              </span>
            </h2>
            <Link className="subtle-link" to={mainLink}>
              Tout voir <ArrowUpRight size={13} />
            </Link>
          </div>
          {visible.length ? (
            <div className="px-6 pb-3">
              {visible.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 border-t border-border/60 py-4"
                >
                  <button
                    type="button"
                    disabled={preview}
                    aria-label={`Terminer : ${task.title}`}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-input hover:border-primary disabled:cursor-default"
                    onClick={() => onToggle?.(task)}
                  >
                    <span className="sr-only">Terminer</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">
                      {task.title}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {task.due_date
                        ? new Intl.DateTimeFormat("fr-FR", {
                            day: "numeric",
                            month: "short",
                          }).format(
                            new Date(task.due_date.slice(0, 10) + "T12:00:00"),
                          )
                        : "Sans échéance"}
                    </p>
                  </div>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${task.priority === "high" ? "bg-amber-500" : task.priority === "medium" ? "bg-primary/60" : "bg-emerald-500"}`}
                    aria-label={`Priorité ${task.priority === "high" ? "haute" : task.priority === "low" ? "basse" : "moyenne"}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state min-h-[215px]">
              <Check size={28} strokeWidth={1.3} />
              <p className="text-sm font-medium">
                L’esprit libre, la liste aussi.
              </p>
              <p className="mb-5 mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Ajoutez une première tâche pour choisir votre prochain pas.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={mainLink}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Créer une tâche
                </Link>
              </Button>
            </div>
          )}
        </section>
        <section className="relative isolate overflow-hidden rounded-[18px] border border-primary/10 bg-[#eeedf9] p-6 dark:bg-[#25243a]">
          <div className="relative z-10">
            <p className="eyebrow !text-primary">UN MOMENT POUR VOUS</p>
            <h2 className="mt-4 max-w-44 text-[24px] font-semibold leading-tight tracking-[-.7px]">
              Moins de bruit.
              <br />
              Plus de flow.
            </h2>
            <p className="mt-3 max-w-44 text-xs leading-relaxed text-muted-foreground">
              25 minutes pour avancer,
              <br />
              une chose à la fois.
            </p>
            <Button asChild className="mt-6 gap-2 rounded-xl text-xs">
              <Link to={preview ? "/register" : "/focus"}>
                <Timer size={14} />
                Lancer une session
              </Link>
            </Button>
          </div>
          <div
            aria-hidden="true"
            className="absolute -right-12 top-[20%] h-56 w-56 rounded-full border-[22px] border-primary/[0.07]"
          >
            <div className="absolute inset-5 rounded-full border-[20px] border-primary/10">
              <div className="absolute inset-6 rounded-full bg-primary/10" />
            </div>
          </div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(240px,.85fr)]">
        <section className="panel">
          <div className="panel-heading">
            <h2 className="text-sm font-semibold">Votre semaine en focus</h2>
            <Clock3 size={15} className="text-muted-foreground" />
          </div>
          <div className="px-6 pb-6">
            <p className="mb-5 text-xs text-muted-foreground">
              <span className="text-lg font-semibold text-foreground">
                {data.focusMinutes}
              </span>{" "}
              minutes de concentration
            </p>
            <div
              role="img"
              aria-label={`Minutes de concentration sur 7 jours : ${data.week.join(", ")}`}
              className="flex h-24 items-end gap-3"
            >
              {data.week.map((value, i) => (
                <div
                  key={i}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div
                    className={`w-full min-w-2 rounded-t-[5px] ${i === 6 ? "bg-primary" : "bg-primary/15"}`}
                    style={{
                      height: `${Math.max(value ? 7 : 2, (value / max) * 70)}px`,
                    }}
                  />
                  <span className="text-center text-[9px] text-muted-foreground">
                    {days[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2 className="text-sm font-semibold">
              Votre campus, au même endroit
            </h2>
            <GraduationCap size={16} className="text-primary" />
          </div>
          <div className="px-6 pb-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Emploi du temps, UE, notes et examens. Un espace qui suit votre
              semestre.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Emploi du temps", "Notes /20", "Révisions"].map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-muted px-2 py-1.5 text-[10px] text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
            <Link
              to={preview ? "/register" : "/student"}
              className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary"
            >
              Ouvrir mon espace étudiant <ArrowRight size={13} />
            </Link>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2 className="text-sm font-semibold">Un coup de pouce ?</h2>
            <Sparkles size={16} className="text-primary" />
          </div>
          <div className="px-6 pb-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Décomposez un projet ou préparez votre semaine avec l’assistant.
            </p>
            <Link
              to={preview ? "/register" : "/ai-assistant"}
              className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-primary"
            >
              En parler avec l’IA <ArrowUpRight size={13} />
            </Link>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Votre quota reste visible et maîtrisé.
            </p>
          </div>
        </section>
      </div>
      <p className="pb-2 text-center text-[10px] text-muted-foreground/70">
        Votre rythme. Vos priorités. Votre espace.
      </p>
    </div>
  );
}
export default function Dashboard() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["overview", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);
      const [tasks, habits, focus] = await Promise.all([
        readAllPages((from, to) =>
          supabase
            .from("tasks")
            .select("id,title,priority,due_date,completed")
            .eq("user_id", user!.id)
            .order("id")
            .range(from, to),
        ),
        supabase
          .from("habits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("is_archived", false),
        supabase
          .from("focus_sessions")
          .select("duration,created_at")
          .eq("user_id", user!.id)
          .gte("created_at", since.toISOString()),
      ]);
      for (const result of [habits, focus])
        if (result.error) throw new Error(result.error.message);
      const dates = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + index);
        return parisDateKey(date);
      });
      const week = dates.map((date) =>
        Math.round(
          (focus.data || [])
            .filter(
              (session) => parisDateKey(new Date(session.created_at)) === date,
            )
            .reduce((sum, session) => sum + session.duration, 0),
        ),
      );
      return {
        tasks,
        habitCount: habits.count || 0,
        week,
        focusMinutes: week.reduce((a, b) => a + b, 0),
      };
    },
  });
  if (query.isLoading)
    return (
      <div
        role="status"
        className="py-20 text-center text-sm text-muted-foreground"
      >
        Chargement de votre journée…
      </div>
    );
  if (query.isError)
    return (
      <div className="space-y-6">
        <OverviewShortcuts />
        <div role="alert" className="panel p-8">
          <h1 className="text-lg font-semibold">
            Votre espace n’a pas pu être chargé.
          </h1>
          <p className="my-3 text-sm text-muted-foreground">
            Vérifiez votre connexion et la configuration de la base de données.
          </p>
          <Button onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  const toggle = async (task: OverviewTask) => {
    const result = await supabase
      .from("tasks")
      .update({ completed: true })
      .eq("id", task.id)
      .eq("user_id", user!.id)
      .select("id")
      .single();
    if (!result.error) void query.refetch();
    else {
      const { toast } = await import("sonner");
      toast.error("La tâche n’a pas pu être mise à jour.");
    }
  };
  return (
    <DashboardView
      data={query.data || emptyOverview}
      name={String(
        user?.user_metadata?.display_name ||
          user?.email?.split("@")[0] ||
          "vous",
      )}
      onToggle={toggle}
    />
  );
}
