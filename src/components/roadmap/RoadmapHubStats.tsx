import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Route,
  TrendingUp,
  CheckCircle2,
  Archive,
  Sparkles,
  Target,
  Repeat,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

const COLORS = ["hsl(var(--primary))", "hsl(142 71% 45%)", "hsl(38 92% 50%)"];

export const RoadmapHubStats = () => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([]);
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [habitsDone, setHabitsDone] = useState(0);
  const [habitsTotal, setHabitsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await (supabase as any)
        .from("ai_roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as RoadmapRow[];
      setRoadmaps(rows);

      const allTaskIds = rows.flatMap((r) => r.task_ids ?? []);
      const allHabitIds = rows.flatMap((r) => r.habit_ids ?? []);
      setTasksTotal(allTaskIds.length);
      setHabitsTotal(allHabitIds.length);

      if (allTaskIds.length) {
        const { data: t } = await supabase
          .from("tasks")
          .select("id, completed")
          .in("id", allTaskIds);
        setTasksDone((t ?? []).filter((x) => x.completed).length);
      }
      if (allHabitIds.length) {
        const { data: h } = await supabase
          .from("habit_completions")
          .select("habit_id")
          .in("habit_id", allHabitIds);
        const s = new Set((h ?? []).map((x) => x.habit_id));
        setHabitsDone(s.size);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading || roadmaps.length === 0) return null;

  const active = roadmaps.filter((r) => r.status === "active");
  const archived = roadmaps.filter((r) => r.status === "archived");
  const totalItems = tasksTotal + habitsTotal;
  const doneItems = tasksDone + habitsDone;
  const completion = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  // Aggregate forecast: average predicted_score per week across active roadmaps
  const weekMap: Record<number, { score: number[]; progress: number[] }> = {};
  for (const r of active) {
    const f = Array.isArray(r.plan?.forecast) ? r.plan.forecast : [];
    for (const p of f) {
      if (!weekMap[p.week]) weekMap[p.week] = { score: [], progress: [] };
      weekMap[p.week].score.push(p.predicted_score);
      weekMap[p.week].progress.push(p.progress);
    }
  }
  const aggForecast = Object.keys(weekMap)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((w) => ({
      name: `S${w}`,
      "Score moyen": Math.round(
        weekMap[w].score.reduce((s, v) => s + v, 0) / weekMap[w].score.length,
      ),
      "Progrès moyen": Math.round(
        weekMap[w].progress.reduce((s, v) => s + v, 0) /
          weekMap[w].progress.length,
      ),
    }));

  // Intensity distribution
  const intensityCounts: Record<string, number> = {};
  for (const r of roadmaps) {
    intensityCounts[r.intensity] = (intensityCounts[r.intensity] ?? 0) + 1;
  }
  const intensityData = Object.entries(intensityCounts).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  // Per-roadmap completion bar
  const perRoadmap = active.slice(0, 8).map((r) => {
    const t = r.task_ids ?? [];
    const h = r.habit_ids ?? [];
    return {
      name:
        r.objective.length > 18 ? r.objective.slice(0, 18) + "…" : r.objective,
      Tâches: t.length,
      Habitudes: h.length,
    };
  });

  return (
    <div className="space-y-4 mb-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{active.length}</div>
              <div className="text-xs text-muted-foreground">
                Roadmaps actives
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completion}%</div>
              <div className="text-xs text-muted-foreground">
                Complétion globale
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-info/10">
              <CheckCircle2 className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {tasksDone}/{tasksTotal}
              </div>
              <div className="text-xs text-muted-foreground">Tâches faites</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/10">
              <Repeat className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {habitsDone}/{habitsTotal}
              </div>
              <div className="text-xs text-muted-foreground">
                Habitudes actives
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Aggregated forecast */}
      {aggForecast.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Évolution moyenne prédite — toutes roadmaps actives
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Moyenne des prédictions hebdomadaires sur {active.length} roadmap
            {active.length > 1 ? "s" : ""}.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggForecast}>
                <defs>
                  <linearGradient id="hubG1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hubG2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Score moyen" stroke="hsl(var(--primary))" fill="url(#hubG1)" strokeWidth={2} />
                <Area type="monotone" dataKey="Progrès moyen" stroke="hsl(142 71% 45%)" fill="url(#hubG2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {perRoadmap.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Charge par roadmap
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perRoadmap} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Tâches" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="Habitudes" fill="hsl(142 71% 45%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {intensityData.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary" />
              Répartition par intensité
            </h3>
            <div className="h-56 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intensityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {intensityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {archived.length > 0 && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                <Badge variant="outline">{archived.length} archivée{archived.length > 1 ? "s" : ""}</Badge>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
