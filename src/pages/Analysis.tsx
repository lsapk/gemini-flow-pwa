import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Target, Timer, TrendingUp, CheckCircle2, Crown, Lock, Brain, Flame, Calendar } from "lucide-react";
import { useUnifiedProductivityScore } from "@/hooks/useUnifiedProductivityScore";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { LifeWheelChart } from "@/components/analysis/LifeWheelChart";
import { ChronobiologyChart } from "@/components/analysis/ChronobiologyChart";
import { ConsistencyHeatmap } from "@/components/analysis/ConsistencyHeatmap";
import { toLocalDateKey } from "@/utils/dateUtils";

export default function Analysis() {
  const { scores, totalFocusTime, streakCount, habitsData, tasksData, focusData, activityData, isLoading, refetch } = useUnifiedProductivityScore();
  const { canUseFeature, trackUsage, isPremium } = useSubscription();
  const { user } = useAuth();
  const [weeklyTrend, setWeeklyTrend] = useState<{ name: string; tasks: number; habits: number }[]>([]);

  // Analysis usage is tracked only when explicitly triggered, not on page load

  // Compute real weekly trend from DB data
  useEffect(() => {
    if (!user) return;
    const computeWeeklyTrend = async () => {
      const now = new Date();
      const days: { name: string; date: string }[] = [];
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push({ name: dayNames[d.getDay()], date: toLocalDateKey(d) });
      }

      // Fetch tasks completed in the last 7 days
      const startDate = days[0].date;
      const endDate = days[6].date + "T23:59:59";

      const [tasksRes, completionsRes] = await Promise.all([
        supabase.from('tasks').select('updated_at').eq('user_id', user.id).eq('completed', true).gte('updated_at', startDate).lte('updated_at', endDate),
        supabase.from('habit_completions').select('completed_date').eq('user_id', user.id).gte('completed_date', startDate).lte('completed_date', days[6].date),
      ]);

      const tasksByDay: Record<string, number> = {};
      const habitsByDay: Record<string, number> = {};
      days.forEach(d => { tasksByDay[d.date] = 0; habitsByDay[d.date] = 0; });

      (tasksRes.data || []).forEach(t => {
        const key = t.updated_at?.split('T')[0];
        if (key && tasksByDay[key] !== undefined) tasksByDay[key]++;
      });
      (completionsRes.data || []).forEach(c => {
        const key = c.completed_date;
        if (key && habitsByDay[key] !== undefined) habitsByDay[key]++;
      });

      setWeeklyTrend(days.map(d => ({
        name: d.name,
        tasks: tasksByDay[d.date],
        habits: habitsByDay[d.date],
      })));
    };
    computeWeeklyTrend();
  }, [user, tasksData, habitsData]);

  const focusChartData = useMemo(() => {
    if (focusData?.length > 0) {
      return focusData.slice(0, 7).map(s => ({ name: s.date || 'Session', value: Math.round(s.minutes || 0) }));
    }
    return [{ name: 'Lun', value: 0 }, { name: 'Mar', value: 0 }, { name: 'Mer', value: 0 }, { name: 'Jeu', value: 0 }, { name: 'Ven', value: 0 }, { name: 'Sam', value: 0 }, { name: 'Dim', value: 0 }];
  }, [focusData]);

  const activityPieData = useMemo(() => [
    { name: 'Tâches', value: scores.taskScore, color: '#10B981' },
    { name: 'Focus', value: scores.focusScore, color: '#3B82F6' },
    { name: 'Habitudes', value: scores.habitScore, color: '#8B5CF6' },
  ], [scores]);

  const efficiencyRadar = useMemo(() => [
    { subject: 'Régularité', value: Math.min(100, streakCount * 15) },
    { subject: 'Focus', value: scores.focusScore },
    { subject: 'Tâches', value: scores.taskScore },
    { subject: 'Habitudes', value: scores.habitScore },
    { subject: 'Objectifs', value: Math.min(100, scores.overall + 10) },
    { subject: 'Énergie', value: Math.min(100, (totalFocusTime / 60) * 8) },
  ], [scores, streakCount, totalFocusTime]);

  if (!canUseFeature("analysis") && !isPremium) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card/30 rounded-3xl border border-border/40 backdrop-blur-sm min-h-[500px] text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Limite quotidienne atteinte</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">Les utilisateurs Basic ont droit à 1 analyse par jour. Passez à Premium pour un accès illimité.</p>
        <Button asChild size="lg"><Link to="/settings"><Crown className="h-4 w-4 mr-2" />Passer à Premium</Link></Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Global Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-border/30 shadow-lg bg-card/60 backdrop-blur-xl">
          <CardContent className="py-5 md:py-7">
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
              <div className="relative group">
                <div className="relative w-32 h-32 md:w-36 md:h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${scores.overall * 3.267} ${326.7 - scores.overall * 3.267}`} className="transition-all duration-1000 ease-out" />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">{scores.overall}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Score</span>
                  </div>
                </div>
                <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-md border-2 border-background px-3 py-1 rounded-full font-semibold text-xs ${
                  scores.overall >= 80 ? 'bg-green-500 text-white' : scores.overall >= 60 ? 'bg-primary text-primary-foreground' : scores.overall >= 40 ? 'bg-amber-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {scores.overall >= 80 ? '🏆 Excellent' : scores.overall >= 60 ? '👍 Bien' : scores.overall >= 40 ? '📈 Progresse' : '🎯 À améliorer'}
                </Badge>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                <div className="text-center p-3.5 bg-secondary/40 backdrop-blur-sm rounded-2xl border border-border/20">
                  <Target className="h-5 w-5 mx-auto mb-1.5 text-green-500" />
                  <div className="text-xl font-bold tracking-tight">{scores.taskScore}%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Tâches</div>
                </div>
                <div className="text-center p-3.5 bg-secondary/40 backdrop-blur-sm rounded-2xl border border-border/20">
                  <Timer className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                  <div className="text-xl font-bold tracking-tight">{Math.round(totalFocusTime / 60)}h</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Focus</div>
                </div>
                <div className="text-center p-3.5 bg-secondary/40 backdrop-blur-sm rounded-2xl border border-border/20">
                  <Flame className="h-5 w-5 mx-auto mb-1.5 text-orange-500" />
                  <div className="text-2xl font-bold">{streakCount}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <LifeWheelChart />
        <ChronobiologyChart />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4 text-blue-500" />Temps de Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={focusChartData}>
                    <defs><linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v} min`, 'Focus']} />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#focusGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Répartition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activityPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {activityPieData.map((entry, i) => (<Cell key={`cell-${i}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {activityPieData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Trend — real data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" />Tendance Hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="tasks" fill="#10B981" radius={[4, 4, 0, 0]} name="Tâches" />
                  <Bar dataKey="habits" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Habitudes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Efficiency Radar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-purple-500" />Radar d'Efficacité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={efficiencyRadar}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ConsistencyHeatmap days={isPremium ? 365 : 90} />

      {/* Stats Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />Résumé Statistique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                <div className="text-2xl font-bold text-emerald-600">{tasksData?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Tâches créées</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                <div className="text-2xl font-bold text-blue-600">{focusData?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Sessions focus</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                <div className="text-2xl font-bold text-purple-600">{habitsData?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Habitudes actives</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                <div className="text-2xl font-bold text-amber-600">{activityData?.reduce((s, d) => s + d.count, 0) || 0}</div>
                <p className="text-xs text-muted-foreground">Activités totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">💡 Conseils Personnalisés</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {scores.taskScore < 50 && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm"><span className="font-medium text-green-600">📋 Tâches:</span> Terminez 2-3 tâches importantes chaque jour.</p>
                </div>
              )}
              {scores.focusScore < 50 && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm"><span className="font-medium text-blue-600">⏱️ Focus:</span> Planifiez des sessions de 25min Pomodoro.</p>
                </div>
              )}
              {scores.habitScore < 50 && (
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm"><span className="font-medium text-purple-600">🔥 Habitudes:</span> Validez vos habitudes chaque jour pour le streak.</p>
                </div>
              )}
              {scores.overall >= 60 && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-sm"><span className="font-medium text-amber-600">🌟 Bravo!</span> Continuez sur cette lancée !</p>
                </div>
              )}
              <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <p className="text-sm"><span className="font-medium text-indigo-600">🧠 Deep Work:</span> Bloquez 2h sans distraction pour vos projets clés.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
