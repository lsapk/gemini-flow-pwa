import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConsistencyHeatmap } from "@/hooks/useConsistencyHeatmap";
import { motion } from "framer-motion";
import { Calendar, Flame, Trophy, Activity, Loader2 } from "lucide-react";
import { format, parseISO, getDay, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from "react";

const LEVEL_COLORS = {
  0: 'bg-muted/50',
  1: 'bg-green-200 dark:bg-green-900/60',
  2: 'bg-green-400 dark:bg-green-700',
  3: 'bg-green-500 dark:bg-green-600',
  4: 'bg-green-600 dark:bg-green-500'
};

const DAYS_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

interface ConsistencyHeatmapProps {
  days?: number;
}

export function ConsistencyHeatmap({ days = 365 }: ConsistencyHeatmapProps) {
  const { data, isLoading } = useConsistencyHeatmap(days);

  const weeks = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];

    const heatmapData = data.data;
    const weeksArray: typeof heatmapData[] = [];
    
    // Group by weeks
    let currentWeek: typeof heatmapData = [];
    
    heatmapData.forEach((day, index) => {
      const dayOfWeek = getDay(parseISO(day.date));
      
      // Start a new week on Sunday (0)
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(day);
      
      // Push last week
      if (index === heatmapData.length - 1) {
        weeksArray.push(currentWeek);
      }
    });

    return weeksArray;
  }, [data?.data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalActiveDays = data?.totalActiveDays || 0;
  const longestStreak = data?.longestStreak || 0;
  const currentStreak = data?.currentStreak || 0;
  const totalActivities = data?.totalActivities || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Consistance
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] rounded-full px-3 bg-white/5 border border-white/10 font-bold uppercase">
              {days} JOURS
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Activités', val: totalActivities, icon: Activity, color: 'text-blue-400' },
              { label: 'Jours Actifs', val: totalActiveDays, icon: Calendar, color: 'text-emerald-400' },
              { label: 'Streak', val: currentStreak, icon: Flame, color: 'text-orange-400' },
              { label: 'Record', val: longestStreak, icon: Trophy, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <s.icon className={`h-4 w-4 mx-auto ${s.color} mb-1.5`} />
                <div className="text-lg font-black">{s.val}</div>
                <div className="text-[9px] text-muted-foreground font-bold uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {/* Day labels column */}
              <div className="flex flex-col gap-1 mr-1">
                {DAYS_LABELS.map((day, i) => (
                  <div key={i} className="w-3.5 h-3.5 text-[8px] font-black text-muted-foreground/50 flex items-center justify-center">
                    {i % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <TooltipProvider delayDuration={100}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {weekIndex === 0 && week.length < 7 && (
                      Array.from({ length: 7 - week.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-3.5 h-3.5" />
                      ))
                    )}
                    
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: weekIndex * 0.005 }}
                            className={`w-3.5 h-3.5 rounded-[4px] cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 shadow-sm ${LEVEL_COLORS[day.level as keyof typeof LEVEL_COLORS]}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="rounded-xl bg-black/90 backdrop-blur-md border-white/10 p-3 shadow-2xl">
                          <div className="font-black text-sm mb-1 capitalize">
                            {format(parseISO(day.date), 'EEEE d MMMM', { locale: fr })}
                          </div>
                          <div className="space-y-1">
                            {day.count === 0 ? (
                              <div className="text-[10px] font-bold text-white/40 uppercase">Aucune activité</div>
                            ) : (
                              <>
                                {day.activities.habits > 0 && <div className="text-[11px] font-bold">✓ {day.activities.habits} Habitude(s)</div>}
                                {day.activities.tasks > 0 && <div className="text-[11px] font-bold">📋 {day.activities.tasks} Tâche(s)</div>}
                                {day.activities.focus > 0 && <div className="text-[11px] font-bold">⏱️ {day.activities.focus} Session(s) focus</div>}
                                {day.activities.journal > 0 && <div className="text-[11px] font-bold">📝 {day.activities.journal} Réflexion(s)</div>}
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>MOINS</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`w-3 h-3 rounded-[3px] ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`} />
            ))}
            <span>PLUS</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
