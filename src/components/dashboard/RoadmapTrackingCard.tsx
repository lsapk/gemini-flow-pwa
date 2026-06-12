import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Route, TrendingUp, CheckCircle2, Trash2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RoadmapRow {
  id: string;
  goal_id: string | null;
  objective: string;
  horizon_weeks: number;
  intensity: string;
  plan: any;
  task_ids: string[];
  habit_ids: string[];
  status: string;
  created_at: string;
}

interface Progression {
  tasksDone: number;
  tasksTotal: number;
  habitsDone: number;
  habitsTotal: number;
  overall: number;
}

export const RoadmapTrackingCard = () => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([]);
  const [progressions, setProgressions] = useState<Record<string, Progression>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ai_roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as RoadmapRow[];
    setRoadmaps(rows);

    // Compute progression for each roadmap
    const progs: Record<string, Progression> = {};
    for (const r of rows) {
      const tIds = r.task_ids ?? [];
      const hIds = r.habit_ids ?? [];

      let tasksDone = 0;
      if (tIds.length > 0) {
        const { data: t } = await supabase
          .from("tasks")
          .select("id, completed")
          .in("id", tIds);
        tasksDone = (t ?? []).filter((x) => x.completed).length;
      }

      let habitsDone = 0;
      if (hIds.length > 0) {
        const since = new Date(r.created_at).toISOString();
        const { data: h } = await supabase
          .from("habit_completions")
          .select("habit_id")
          .in("habit_id", hIds)
          .gte("created_at", since);
        const set = new Set((h ?? []).map((x) => x.habit_id));
        habitsDone = set.size;
      }

      const totalItems = tIds.length + hIds.length;
      const doneItems = tasksDone + habitsDone;
      const overall = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

      progs[r.id] = {
        tasksDone,
        tasksTotal: tIds.length,
        habitsDone,
        habitsTotal: hIds.length,
        overall,
      };
    }
    setProgressions(progs);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const archive = async (id: string) => {
    const { error } = await (supabase as any)
      .from("ai_roadmaps")
      .update({ status: "archived" })
      .eq("id", id);
    if (error) {
      toast.error("Impossible d'archiver");
      return;
    }
    toast.success("Roadmap archivée");
    load();
  };

  if (loading) return null;
  if (roadmaps.length === 0) return null;

  return (
    <Card className="dashboard-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-heading">
          <div className="p-2 rounded-lg bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          Mes Roadmaps IA
          <Badge variant="secondary" className="ml-2">{roadmaps.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {roadmaps.map((r) => {
          const p = progressions[r.id];
          const isOpen = expandedId === r.id;
          const forecast = Array.isArray(r.plan?.forecast) ? r.plan.forecast : [];
          const chartData = forecast.map((f: any) => ({
            name: `S${f.week}`,
            Score: f.predicted_score,
            Progrès: f.progress,
            milestone: f.milestone,
          }));

          return (
            <div
              key={r.id}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{r.objective}</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {r.horizon_weeks} sem.
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {r.intensity}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      Démarrée le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => archive(r.id)}
                  title="Archiver"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {p && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progression globale</span>
                    <span className="font-bold text-primary">{p.overall}%</span>
                  </div>
                  <Progress value={p.overall} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      Tâches : <span className="font-semibold text-foreground">{p.tasksDone}/{p.tasksTotal}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5 text-info" />
                      Habitudes : <span className="font-semibold text-foreground">{p.habitsDone}/{p.habitsTotal}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                {isOpen ? "Masquer les détails" : "Voir l'évolution prédite"}
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </Button>

              {isOpen && chartData.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`g1-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`g2-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          formatter={(v: any, n: any) => [`${v}%`, n]}
                        />
                        <Area type="monotone" dataKey="Score" stroke="hsl(var(--primary))" fill={`url(#g1-${r.id})`} strokeWidth={2} />
                        <Area type="monotone" dataKey="Progrès" stroke="hsl(142 71% 45%)" fill={`url(#g2-${r.id})`} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {Array.isArray(r.plan?.advices) && r.plan.advices.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                        Conseils
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {r.plan.advices.slice(0, 4).map((a: any, i: number) => (
                          <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40">
                            <div className="text-xs font-medium">{a.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{a.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.goal_id && (
                    <Link to="/goals">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Voir l'objectif lié
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
