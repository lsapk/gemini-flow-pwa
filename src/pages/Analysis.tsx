import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Target, Timer, TrendingUp, CheckCircle2, Crown, Lock } from "lucide-react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { LifeWheelChart } from "@/components/analysis/LifeWheelChart";
import { ChronobiologyChart } from "@/components/analysis/ChronobiologyChart";
import { ConsistencyHeatmap } from "@/components/analysis/ConsistencyHeatmap";

export default function Analysis() {
  const { habitsData, tasksData, focusData, activityData, isLoading, refetch, taskCompletionRate, totalFocusTime, streakCount } = useAnalyticsData();
  const { canUseFeature, trackUsage, isPremium } = useSubscription();

  // Track analysis usage when component loads
  useEffect(() => {
    if (!isPremium && canUseFeature("analysis")) {
      trackUsage("analysis");
    }
  }, []);

  // Calculate scores from real data
  const scores = useMemo(() => {
    const taskScore = Math.min(100, Math.round(taskCompletionRate || 0));
    const focusScore = Math.min(100, Math.round((totalFocusTime || 0) / 60 * 10)); // 10 points per hour
    const habitScore = Math.min(100, (streakCount || 0) * 10);
    const overall = Math.round((taskScore + focusScore + habitScore) / 3);
    
    return { taskScore, focusScore, habitScore, overall };
  }, [taskCompletionRate, totalFocusTime, streakCount]);

  // Prepare chart data
  const focusChartData = useMemo(() => {
    if (focusData && focusData.length > 0) {
      return focusData.slice(0, 7).map(session => ({
        name: session.date || 'Session',
        value: Math.round(session.minutes || 0)
      }));
    }
    return [
      { name: 'Lun', value: 45 },
      { name: 'Mar', value: 60 },
      { name: 'Mer', value: 30 },
      { name: 'Jeu', value: 90 },
      { name: 'Ven', value: 75 },
      { name: 'Sam', value: 20 },
      { name: 'Dim', value: 10 }
    ];
  }, [focusData]);

  const activityPieData = useMemo(() => {
    return [
      { name: 'Tâches', value: scores.taskScore, color: '#10B981' },
      { name: 'Focus', value: scores.focusScore, color: '#3B82F6' },
      { name: 'Habitudes', value: scores.habitScore, color: '#8B5CF6' }
    ];
  }, [scores]);

  // Check if user can access analysis
  if (!canUseFeature("analysis") && !isPremium) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Limite quotidienne atteinte</h3>
            <p className="text-muted-foreground mb-6">
              Les utilisateurs Basic ont droit à 1 analyse par jour.
            </p>
            <Button asChild size="lg">
              <Link to="/settings">
                <Crown className="h-4 w-4 mr-2" />
                Passer à Premium
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Score Global - Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-primary/20 shadow-sm">
          <CardContent className="py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              {/* Score Circle */}
              <div className="relative">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                  <div className="w-22 h-22 md:w-26 md:h-26 rounded-full bg-background flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl font-bold">{scores.overall}</span>
                      <span className="text-lg text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${
                    scores.overall >= 80 ? 'bg-green-500' :
                    scores.overall >= 60 ? 'bg-blue-500' :
                    scores.overall >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                  } text-white`}
                >
                  {scores.overall >= 80 ? '🏆 Excellent' :
                   scores.overall >= 60 ? '👍 Bien' :
                   scores.overall >= 40 ? '📈 Progresse' : '🎯 À améliorer'}
                </Badge>
              </div>

              {/* Stats Grid */}
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
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{streakCount}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Roue de la Vie - Life Balance Radar */}
      <div className="grid md:grid-cols-2 gap-4">
        <LifeWheelChart />
        <ChronobiologyChart />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Focus Time Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                Temps de Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={focusChartData}>
                    <defs>
                      <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value} min`, 'Focus']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      fill="url(#focusGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Répartition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {activityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {activityPieData.map((item) => (
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

      {/* Consistency Heatmap - Full Width */}
      <ConsistencyHeatmap days={isPremium ? 365 : 90} />

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">💡 Conseils Rapides</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {scores.taskScore < 50 && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm">
                    <span className="font-medium text-green-600">📋 Tâches:</span> Essayez de terminer 2-3 tâches importantes chaque jour.
                  </p>
                </div>
              )}
              {scores.focusScore < 50 && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm">
                    <span className="font-medium text-blue-600">⏱️ Focus:</span> Planifiez des sessions de 25min pour booster votre concentration.
                  </p>
                </div>
              )}
              {scores.habitScore < 50 && (
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm">
                    <span className="font-medium text-purple-600">🔥 Habitudes:</span> Maintenez votre streak en validant vos habitudes quotidiennes.
                  </p>
                </div>
              )}
              {scores.overall >= 60 && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-sm">
                    <span className="font-medium text-amber-600">🌟 Bravo!</span> Continuez sur cette lancée, vous êtes sur la bonne voie!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
