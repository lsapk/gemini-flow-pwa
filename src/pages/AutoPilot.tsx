import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  Repeat,
  Target,
  Loader2,
  PartyPopper,
  TrendingUp,
  Lightbulb,
  ShieldAlert,
  Route,
} from "lucide-react";
import { RoadmapHubStats } from "@/components/roadmap/RoadmapHubStats";
import { RoadmapTrackingCard } from "@/components/dashboard/RoadmapTrackingCard";


interface RoadmapProps {
  embedded?: boolean;
  presetObjective?: string;
  presetGoalId?: string;
  onApplied?: () => void;
}


interface PlanGoal {
  title: string;
  description: string;
  category: string;
  target_date: string;
}
interface PlanTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  due_date?: string;
}
interface PlanHabit {
  title: string;
  description?: string;
  frequency: "daily" | "weekly";
  days_of_week?: number[];
  category?: string;
}
interface ForecastPoint {
  week: number;
  predicted_score: number;
  progress: number;
  milestone: string;
}
interface Advice {
  title: string;
  content: string;
}
interface Risk {
  risk: string;
  mitigation: string;
}
interface Plan {
  goal: PlanGoal;
  tasks: PlanTask[];
  habits: PlanHabit[];
  weekly_plan: string;
  forecast: ForecastPoint[];
  advices: Advice[];
  risks: Risk[];
  rationale: string;
}

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export default function AutoPilot({ embedded = false, presetObjective: presetObjectiveProp, presetGoalId, onApplied }: RoadmapProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [objective, setObjective] = useState(presetObjectiveProp ?? "");
  const [horizon, setHorizon] = useState(12);
  const [intensity, setIntensity] = useState<"chill" | "balanced" | "intense">(
    "balanced",
  );
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectedHabits, setSelectedHabits] = useState<Set<number>>(new Set());
  const isOnboarding = searchParams.get("onboarding") === "1";

  useEffect(() => {
    if (presetObjectiveProp) return;
    const presetObjective = searchParams.get("objective");
    if (presetObjective) setObjective(presetObjective);
  }, [searchParams, presetObjectiveProp]);

  useEffect(() => {
    if (plan) {
      setSelectedTasks(new Set(plan.tasks.map((_, i) => i)));
      setSelectedHabits(new Set(plan.habits.map((_, i) => i)));
    }
  }, [plan]);

  const forecastData = useMemo(() => {
    if (!plan?.forecast) return [];
    return plan.forecast.map((f) => ({
      name: `S${f.week}`,
      Score: f.predicted_score,
      Progrès: f.progress,
      milestone: f.milestone,
    }));
  }, [plan]);

  async function generate() {
    if (objective.trim().length < 5) {
      toast.error("Décris ton objectif un peu plus en détail.");
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-autopilot", {
        body: {
          action: "preview",
          objective,
          horizon_weeks: horizon,
          intensity,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(
          data.error === "AI_LIMIT_REACHED"
            ? "Crédits IA épuisés."
            : data.error,
        );
        return;
      }
      setPlan(data.plan);
      toast.success("✨ Roadmap générée");
    } catch (e: any) {
      toast.error(e?.message || "Erreur de génération");
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!plan) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-autopilot", {
        body: {
          action: "apply",
          plan,
          goal_id: presetGoalId ?? null,
          intensity,
          selected_task_indices: Array.from(selectedTasks),
          selected_habit_indices: Array.from(selectedHabits),
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(
        presetGoalId
          ? `Objectif mis à jour : ${data.task_ids.length} tâches et ${data.habit_ids.length} habitudes ajoutées.`
          : `Roadmap appliquée : 1 objectif, ${data.task_ids.length} tâches, ${data.habit_ids.length} habitudes.`,
      );
      if (onApplied) onApplied();
      else navigate("/goals");

    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setApplying(false);
    }
  }

  function toggleTask(i: number) {
    setSelectedTasks((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }
  function toggleHabit(i: number) {
    setSelectedHabits((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }

  return (
    <div
      className={
        embedded ? "w-full" : "container mx-auto max-w-5xl px-4 py-8"
      }
    >
      {isOnboarding && (
        <Card className="p-5 mb-6 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-start gap-3">
            <PartyPopper className="w-6 h-6 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-base mb-1">
                Bienvenue sur DeepFlow 👋
              </h3>
              <p className="text-sm text-muted-foreground">
                Décris ton objectif principal. L'IA construit ta roadmap
                personnalisée avec prédictions, conseils et propositions de
                tâches.
              </p>
            </div>
          </div>
        </Card>
      )}
      {!embedded && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Route className="w-7 h-7 text-primary" />
              Roadmap IA personnalisée
            </h1>
            <p className="text-muted-foreground">
              Centre de pilotage de tes roadmaps : suivi en temps réel, stats,
              graphiques prédictifs et générateur sur-mesure.
            </p>
          </div>

          <RoadmapHubStats />
          <RoadmapTrackingCard />

          <div className="mt-6 mb-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Générer une nouvelle roadmap
            </h2>
          </div>
        </>
      )}


      <Card className="p-6 mb-6 space-y-4">
        <div>
          <Label>Ton objectif</Label>
          <Textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Ex : Lancer mon side-project SaaS en 3 mois, courir un semi-marathon, écrire un livre…"
            rows={3}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <Label className="flex justify-between mb-2">
              <span>Horizon</span>
              <span className="text-muted-foreground">
                {horizon} semaines
              </span>
            </Label>
            <Slider
              value={[horizon]}
              min={1}
              max={52}
              step={1}
              onValueChange={(v) => setHorizon(v[0])}
            />
          </div>
          <div>
            <Label className="mb-2 block">Intensité</Label>
            <ToggleGroup
              type="single"
              value={intensity}
              onValueChange={(v) => v && setIntensity(v as any)}
            >
              <ToggleGroupItem value="chill">Chill</ToggleGroupItem>
              <ToggleGroupItem value="balanced">Équilibré</ToggleGroupItem>
              <ToggleGroupItem value="intense">Intense</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Générer ma roadmap
        </Button>
      </Card>

      {plan && (
        <div className="space-y-4">
          {/* Goal header */}
          <Card className="p-6 border-primary/40">
            <div className="flex items-start gap-3 mb-3">
              <Target className="w-6 h-6 text-primary mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{plan.goal.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.goal.description}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary">{plan.goal.category}</Badge>
                  <Badge variant="outline">🎯 {plan.goal.target_date}</Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
              {plan.rationale}
            </p>
          </Card>

          {/* Predictive chart */}
          {forecastData.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Évolution prédite
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Score productivité projeté et progression de l'objectif sur{" "}
                {plan.forecast.length} semaines.
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecastData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--chart-2, 142 71% 45%))"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--chart-2, 142 71% 45%))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: any, name: any) => [`${value}%`, name]}
                      labelFormatter={(label: string, payload: any) => {
                        const m = payload?.[0]?.payload?.milestone;
                        return m ? `${label} — ${m}` : label;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="Score"
                      stroke="hsl(var(--primary))"
                      fill="url(#grad1)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Progrès"
                      stroke="hsl(var(--chart-2, 142 71% 45%))"
                      fill="url(#grad2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Milestones */}
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                {plan.forecast
                  .filter((_, i) => i === 0 || (i + 1) % Math.max(1, Math.ceil(plan.forecast.length / 4)) === 0 || i === plan.forecast.length - 1)
                  .map((f) => (
                    <div
                      key={f.week}
                      className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/40"
                    >
                      <Badge variant="outline" className="shrink-0">
                        S{f.week}
                      </Badge>
                      <span className="text-muted-foreground">
                        {f.milestone}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Advices */}
          {plan.advices?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Conseils personnalisés
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {plan.advices.map((a, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-border/60 bg-muted/30"
                  >
                    <div className="font-medium text-sm mb-1">{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.content}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Risks */}
          {plan.risks?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Risques & mitigation
              </h3>
              <div className="space-y-2">
                {plan.risks.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-border/60"
                  >
                    <div className="text-sm font-medium">⚠️ {r.risk}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ✅ {r.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Task proposals */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Propositions de tâches ({selectedTasks.size}/{plan.tasks.length})
            </h3>
            <div className="space-y-2">
              {plan.tasks.map((t, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTasks.has(i)}
                    onCheckedChange={() => toggleTask(i)}
                    className="mt-1"
                  />
                  <Badge
                    variant={
                      t.priority === "high"
                        ? "destructive"
                        : t.priority === "medium"
                          ? "default"
                          : "secondary"
                    }
                    className="mt-0.5"
                  >
                    {t.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{t.title}</div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    )}
                  </div>
                  {t.due_date && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {t.due_date}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </Card>

          {/* Habit proposals */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary" />
              Propositions d'habitudes ({selectedHabits.size}/
              {plan.habits.length})
            </h3>
            <div className="space-y-2">
              {plan.habits.map((h, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedHabits.has(i)}
                    onCheckedChange={() => toggleHabit(i)}
                    className="mt-1"
                  />
                  <Badge variant="outline" className="mt-0.5">
                    {h.frequency}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{h.title}</div>
                    {h.description && (
                      <div className="text-xs text-muted-foreground">
                        {h.description}
                      </div>
                    )}
                    {h.days_of_week && h.days_of_week.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {DAY_LABELS.map((d, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center ${
                              h.days_of_week?.includes(idx)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Cadence hebdomadaire
            </h3>
            <p className="text-sm whitespace-pre-wrap">{plan.weekly_plan}</p>
          </Card>

          <div className="flex gap-2 sticky bottom-4">
            <Button
              variant="outline"
              onClick={() => setPlan(null)}
              className="flex-1"
            >
              Recommencer
            </Button>
            <Button
              onClick={apply}
              disabled={applying}
              className="flex-1"
            >
              {applying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Appliquer la roadmap
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
