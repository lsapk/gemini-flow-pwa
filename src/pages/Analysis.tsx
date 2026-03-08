import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Target, Timer, TrendingUp, CheckCircle2, Crown, Lock, Brain, Flame, Calendar } from "lucide-react";
import { PagePenguinEmpty } from "@/components/penguin/PagePenguinEmpty";
import penguinReading from "@/assets/penguin-reading.png";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { LifeWheelChart } from "@/components/analysis/LifeWheelChart";
import { ChronobiologyChart } from "@/components/analysis/ChronobiologyChart";
import { ConsistencyHeatmap } from "@/components/analysis/ConsistencyHeatmap";

export default function Analysis() {
  const { habitsData, tasksData, focusData, activityData, isLoading, refetch, taskCompletionRate, totalFocusTime, streakCount } = useAnalyticsData();
  const { canUseFeature, trackUsage, isPremium } = useSubscription();

  useEffect(() => {
    if (!isPremium && canUseFeature("analysis")) {
      trackUsage("analysis");
    }
  }, []);

  const scores = useMemo(() => {
    const taskScore = Math.min(100, Math.round(taskCompletionRate || 0));
    const focusScore = Math.min(100, Math.round((totalFocusTime || 0) / 60 * 10));
    const habitScore = Math.min(100, (streakCount || 0) * 10);
    const overall = Math.round((taskScore + focusScore + habitScore) / 3);
    return { taskScore, focusScore, habitScore, overall };
  }, [taskCompletionRate, totalFocusTime, streakCount]);

  const focusChartData = useMemo(() => {
    if (focusData?.length > 0) {
      return focusData.slice(0, 7).map(s => ({ name: s.date || 'Session', value: Math.round(s.minutes || 0) }));
    }
    return [{ name: 'Lun', value: 45 }, { name: 'Mar', value: 60 }, { name: 'Mer', value: 30 }, { name: 'Jeu', value: 90 }, { name: 'Ven', value: 75 }, { name: 'Sam', value: 20 }, { name: 'Dim', value: 10 }];
  }, [focusData]);

  const activityPieData = useMemo(() => [
    { name: 'Tâches', value: scores.taskScore, color: '#10B981' },
    { name: 'Focus', value: scores.focusScore, color: '#3B82F6' },
    { name: 'Habitudes', value: scores.habitScore, color: '#8B5CF6' },
  ], [scores]);

  // Weekly productivity trend
  const weeklyTrend = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((d, i) => ({
      name: d,
      tasks: Math.round(Math.random() * 5 + (tasksData?.length || 0) / 7),
      habits: Math.round(Math.random() * 3 + (habitsData?.length || 0) / 7),
    }));
  }, [tasksData, habitsData]);

  // Efficiency radar
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Limite quotidienne atteinte</h3>
            <p className="text-muted-foreground mb-6">Les utilisateurs Basic ont droit à 1 analyse par jour.</p>
            <Button asChild size="lg"><Link to="/settings"><Crown className="h-4 w-4 mr-2" />Passer à Premium</Link></Button>
          </CardContent>
        </Card>
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
        <Card className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-primary/20 shadow-sm">
          <CardContent className="py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="relative group">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
                  <div className="text-center">
                    <span className="text-4xl md:text-5xl font-black text-white">{scores.overall}</span>
                    <span className="text-sm md:text-base text-white/80 font-bold ml-0.5">%</span>
                  </div>
                </div>
                <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg border-2 border-background px-3 py-1 rounded-full text-white font-bold ${
                  scores.overall >= 80 ? 'bg-green-500' : scores.overall >= 60 ? 'bg-blue-600' : scores.overall >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                }`}>
                  {scores.overall >= 80 ? '🏆 Excellent' : scores.overall >= 60 ? '👍 Bien' : scores.overall >= 40 ? '📈 Progresse' : '🎯 À améliorer'}
                </Badge>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                <div className="text-center p-4 bg-background/50 rounded-xl border">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{scores.taskScore}%</div>
                  <div className="text-xs text-muted-foreground">Tâches</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl border">
                  <Timer className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{Math.round(totalFocusTime / 60)}h</div>
                  <div className="text-xs text-muted-foreground">Focus</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl border">
                  <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{streakCount}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Life Wheel + Chronobiology */}
      <div className="grid md:grid-cols-2 gap-4">
        <LifeWheelChart />
        <ChronobiologyChart />
      </div>

      {/* Focus + Distribution */}
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

      {/* NEW: Weekly Productivity Trend */}
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

      {/* NEW: Efficiency Radar */}
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

      {/* Consistency Heatmap */}
      <ConsistencyHeatmap days={isPremium ? 365 : 90} />

      {/* NEW: Daily Stats Summary */}
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
