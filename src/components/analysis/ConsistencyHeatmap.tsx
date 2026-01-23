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
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Heatmap de Consistance
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {days} jours
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Activity className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <div className="text-lg font-bold">{totalActivities}</div>
              <div className="text-xs text-muted-foreground">Activités</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <div className="text-lg font-bold">{totalActiveDays}</div>
              <div className="text-xs text-muted-foreground">Jours actifs</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <div className="text-lg font-bold">{currentStreak}</div>
              <div className="text-xs text-muted-foreground">Streak actuel</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Trophy className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <div className="text-lg font-bold">{longestStreak}</div>
              <div className="text-xs text-muted-foreground">Meilleur streak</div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="flex gap-0.5 min-w-max">
              {/* Day labels column */}
              <div className="flex flex-col gap-0.5 mr-1">
                {DAYS_LABELS.map((day, i) => (
                  <div 
                    key={i} 
                    className="w-3 h-3 text-[9px] text-muted-foreground flex items-center justify-center"
                  >
                    {i % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <TooltipProvider delayDuration={100}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {/* Fill empty days at start of first week */}
                    {weekIndex === 0 && week.length < 7 && (
                      Array.from({ length: 7 - week.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-3 h-3" />
                      ))
                    )}
                    
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: weekIndex * 0.01 }}
                            className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${LEVEL_COLORS[day.level]}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="font-medium">
                            {format(parseISO(day.date), 'd MMMM yyyy', { locale: fr })}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {day.count === 0 ? (
                              'Aucune activité'
                            ) : (
                              <>
                                {day.activities.habits > 0 && <div>✓ {day.activities.habits} habitude(s)</div>}
                                {day.activities.tasks > 0 && <div>📋 {day.activities.tasks} tâche(s)</div>}
                                {day.activities.focus > 0 && <div>⏱️ {day.activities.focus} session(s)</div>}
                                {day.activities.journal > 0 && <div>📝 {day.activities.journal} entrée(s)</div>}
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
          <div className="flex items-center justify-end gap-1 mt-4 text-xs text-muted-foreground">
            <span>Moins</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div 
                key={level} 
                className={`w-3 h-3 rounded-sm ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`} 
              />
            ))}
            <span>Plus</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
