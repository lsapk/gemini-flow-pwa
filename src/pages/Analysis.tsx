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
import confetti from 'canvas-confetti';

export default function Analysis() {
  const { scores, totalFocusTime, streakCount, habitsData, tasksData, focusData, activityData, isLoading, refetch } = useUnifiedProductivityScore();
  const { canUseFeature, trackUsage, isPremium } = useSubscription();
  const { user } = useAuth();
  const [weeklyTrend, setWeeklyTrend] = useState<{ name: string; tasks: number; habits: number }[]>([]);




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

  useEffect(() => {
    if (!isLoading && scores.overall >= 80) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#3B82F6', '#10B981'],
          ticks: 300
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scores.overall]);

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
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Global Score - Apple Fluid Style */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <Card className="overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl rounded-[3rem] relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] -z-10 rounded-full" />

          <CardContent className="py-8 md:py-12">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="relative group">
                <motion.div
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: -90, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="relative w-48 h-48 md:w-56 md:h-56"
                >
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#appleGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 340" }}
                      animate={{ strokeDasharray: `${scores.overall * 3.39} 340` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <defs>
                      <linearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
                    >
                      {scores.overall}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      transition={{ delay: 1.2 }}
                      className="text-[10px] font-bold uppercase tracking-[0.3em] text-white mt-1"
                    >
                      PRODUCTIVITÉ
                    </motion.span>
                  </div>
                </motion.div>

                {scores.overall >= 80 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5, type: "spring" }}
                    className="absolute -top-2 -right-2 bg-amber-400 p-2 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                  >
                    <Crown className="w-5 h-5 text-amber-900" />
                  </motion.div>
                )}
              </div>

              <div className="flex-1 space-y-8 w-full">
                <div>
                  <h3 className="text-xl font-bold text-white/90 mb-1">Analyse Quotidienne</h3>
                  <p className="text-sm text-muted-foreground">Votre performance est <span className="text-primary font-bold">{scores.overall >= 80 ? 'exceptionnelle' : scores.overall >= 60 ? 'solide' : 'en progression'}</span> aujourd'hui.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Tâches', val: `${scores.taskScore}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Focus', val: `${Math.round(totalFocusTime / 60)}h`, icon: Timer, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Streak', val: streakCount, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + (i * 0.1) }}
                      className="flex flex-col items-center p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
                    >
                      <div className={`p-2 rounded-2xl ${stat.bg} ${stat.color} mb-2`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className="text-xl font-black text-white">{stat.val}</div>
                      <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</div>
                    </motion.div>
                  ))}
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
          <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Timer className="h-4 w-4 text-blue-500" />Temps de Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={focusChartData}>
                    <defs>
                      <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                      formatter={(v: number) => [`${v} min`, 'Focus']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={4} fill="url(#focusGradient)" dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Répartition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {activityPieData.map((entry, i) => (<Cell key={`cell-${i}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                      formatter={(v: number) => [`${v}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {activityPieData.map(item => (
                  <div key={item.name} className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.name}</span>
                    </div>
                    <span className="text-sm font-black">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Trend — real data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" />Tendance Hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend} barGap={8}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="tasks" fill="#10B981" radius={[10, 10, 10, 10]} barSize={8} name="Tâches" />
                  <Bar dataKey="habits" fill="#8B5CF6" radius={[10, 10, 10, 10]} barSize={8} name="Habitudes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Efficiency Radar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Brain className="h-4 w-4 text-purple-500" />Radar d'Efficacité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={efficiencyRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }} />
                  <Radar name="Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ConsistencyHeatmap days={isPremium ? 365 : 90} />

      {/* Stats Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />Résumé Statistique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Tâches', val: tasksData?.length || 0, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                { label: 'Sessions Focus', val: focusData?.length || 0, color: 'text-blue-400', bg: 'bg-blue-400/5' },
                { label: 'Habitudes', val: habitsData?.length || 0, color: 'text-purple-400', bg: 'bg-purple-400/5' },
                { label: 'Activités', val: activityData?.reduce((s, d) => s + d.count, 0) || 0, color: 'text-amber-400', bg: 'bg-amber-400/5' },
              ].map((stat) => (
                <div key={stat.label} className={`p-4 rounded-[1.5rem] ${stat.bg} border border-white/5 text-center`}>
                  <div className={`text-3xl font-black ${stat.color}`}>{stat.val}</div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">💡 Conseils Personnalisés</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="rounded-full h-8 w-8 p-0 hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {scores.taskScore < 50 && (
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <p className="text-sm font-medium"><span className="text-emerald-400 font-bold uppercase text-[10px] block mb-0.5">Tâches</span> Terminez 2-3 tâches importantes chaque jour pour augmenter votre score.</p>
                </div>
              )}
              {scores.focusScore < 50 && (
                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  <p className="text-sm font-medium"><span className="text-blue-400 font-bold uppercase text-[10px] block mb-0.5">Focus</span> Planifiez des sessions Pomodoro de 25min pour muscler votre concentration.</p>
                </div>
              )}
              {scores.habitScore < 50 && (
                <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                  <p className="text-sm font-medium"><span className="text-purple-400 font-bold uppercase text-[10px] block mb-0.5">Habitudes</span> Validez vos habitudes chaque jour pour maintenir votre streak.</p>
                </div>
              )}
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <p className="text-sm font-medium"><span className="text-indigo-400 font-bold uppercase text-[10px] block mb-0.5">Deep Work</span> Bloquez 2h sans distraction pour vos projets les plus créatifs.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
