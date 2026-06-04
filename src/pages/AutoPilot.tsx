import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, Calendar as CalendarIcon, Repeat, Target, Loader2, PartyPopper } from "lucide-react";

interface AutoPilotProps {
  embedded?: boolean;
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
interface Plan {
  goal: PlanGoal;
  tasks: PlanTask[];
  habits: PlanHabit[];
  weekly_plan: string;
  rationale: string;
}

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export default function AutoPilot({ embedded = false }: AutoPilotProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [objective, setObjective] = useState("");
  const [horizon, setHorizon] = useState(12);
  const [intensity, setIntensity] = useState<"chill" | "balanced" | "intense">("balanced");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const isOnboarding = searchParams.get("onboarding") === "1";

  useEffect(() => {
    const presetObjective = searchParams.get("objective");
    if (presetObjective) setObjective(presetObjective);
  }, [searchParams]);

  async function generate() {
    if (objective.trim().length < 5) {
      toast.error("Décris ton objectif un peu plus en détail.");
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-autopilot", {
        body: { action: "preview", objective, horizon_weeks: horizon, intensity },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error === "AI_LIMIT_REACHED" ? "Crédits IA épuisés." : data.error);
        return;
      }
      setPlan(data.plan);
      toast.success("✨ Plan généré");
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
        body: { action: "apply", plan },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(`Plan appliqué : 1 objectif, ${data.task_ids.length} tâches, ${data.habit_ids.length} habitudes.`);
      navigate("/goals");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          DeepFlow Auto-Pilot
        </h1>
        <p className="text-muted-foreground">
          Donne-moi un objectif vague. Je construis ton plan complet : objectif, tâches, habitudes, cadence hebdomadaire.
        </p>
      </div>

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
              <span className="text-muted-foreground">{horizon} semaines</span>
            </Label>
            <Slider value={[horizon]} min={1} max={52} step={1} onValueChange={(v) => setHorizon(v[0])} />
          </div>
          <div>
            <Label className="mb-2 block">Intensité</Label>
            <ToggleGroup type="single" value={intensity} onValueChange={(v) => v && setIntensity(v as any)}>
              <ToggleGroupItem value="chill">Chill</ToggleGroupItem>
              <ToggleGroupItem value="balanced">Équilibré</ToggleGroupItem>
              <ToggleGroupItem value="intense">Intense</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Générer mon plan
        </Button>
      </Card>

      {plan && (
        <div className="space-y-4">
          <Card className="p-6 border-primary/40">
            <div className="flex items-start gap-3 mb-3">
              <Target className="w-6 h-6 text-primary mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{plan.goal.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.goal.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{plan.goal.category}</Badge>
                  <Badge variant="outline">🎯 {plan.goal.target_date}</Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
              {plan.rationale}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> {plan.tasks.length} tâches
            </h3>
            <div className="space-y-2">
              {plan.tasks.map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40">
                  <Badge
                    variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "default" : "secondary"}
                    className="mt-0.5"
                  >
                    {t.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{t.title}</div>
                    {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                  </div>
                  {t.due_date && <span className="text-xs text-muted-foreground whitespace-nowrap">{t.due_date}</span>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary" /> {plan.habits.length} habitudes
            </h3>
            <div className="space-y-2">
              {plan.habits.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40">
                  <Badge variant="outline" className="mt-0.5">{h.frequency}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{h.title}</div>
                    {h.description && <div className="text-xs text-muted-foreground">{h.description}</div>}
                    {h.days_of_week && h.days_of_week.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {DAY_LABELS.map((d, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center ${
                              h.days_of_week?.includes(idx) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> Cadence hebdomadaire
            </h3>
            <p className="text-sm whitespace-pre-wrap">{plan.weekly_plan}</p>
          </Card>

          <div className="flex gap-2 sticky bottom-4">
            <Button variant="outline" onClick={() => setPlan(null)} className="flex-1">
              Recommencer
            </Button>
            <Button onClick={apply} disabled={applying} className="flex-1">
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Appliquer le plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
