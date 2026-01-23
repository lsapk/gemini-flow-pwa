import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChronobiologyData } from "@/hooks/useChronobiologyData";
import { motion } from "framer-motion";
import { Clock, Sunrise, Sun, Moon, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from "recharts";

const TYPE_ICONS = {
  early_bird: Sunrise,
  afternoon_warrior: Sun,
  night_owl: Moon,
  balanced: Clock
};

const TYPE_COLORS = {
  early_bird: 'bg-amber-500',
  afternoon_warrior: 'bg-orange-500',
  night_owl: 'bg-indigo-500',
  balanced: 'bg-blue-500'
};

const TYPE_LABELS = {
  early_bird: 'Lève-tôt',
  afternoon_warrior: 'Après-midi',
  night_owl: 'Noctambule',
  balanced: 'Équilibré'
};

export function ChronobiologyChart() {
  const { data, isLoading } = useChronobiologyData();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hourlyData = data?.hourlyData || [];
  const productivityType = data?.productivityType || 'balanced';
  const insight = data?.insight || '';
  const recommendation = data?.recommendation || '';
  const stats = data?.stats || { morningPercent: 33, afternoonPercent: 33, eveningPercent: 34 };
  const peakHour = data?.peakHour || 9;

  const TypeIcon = TYPE_ICONS[productivityType];

  // Format data for chart - show only relevant hours (5h-23h)
  const chartData = hourlyData
    .filter(h => h.hour >= 5 && h.hour <= 23)
    .map(h => ({
      ...h,
      name: `${h.hour}h`,
      isPeak: h.hour === peakHour
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Chronobiologie
            </CardTitle>
            <Badge className={`${TYPE_COLORS[productivityType]} text-white flex items-center gap-1`}>
              <TypeIcon className="h-3 w-3" />
              {TYPE_LABELS[productivityType]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Time Distribution Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-amber-500/10 rounded-lg">
              <Sunrise className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <div className="text-lg font-bold">{stats.morningPercent}%</div>
              <div className="text-xs text-muted-foreground">Matin</div>
            </div>
            <div className="text-center p-2 bg-orange-500/10 rounded-lg">
              <Sun className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <div className="text-lg font-bold">{stats.afternoonPercent}%</div>
              <div className="text-xs text-muted-foreground">Après-midi</div>
            </div>
            <div className="text-center p-2 bg-indigo-500/10 rounded-lg">
              <Moon className="h-4 w-4 mx-auto text-indigo-500 mb-1" />
              <div className="text-lg font-bold">{stats.eveningPercent}%</div>
              <div className="text-xs text-muted-foreground">Soir</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      tasks: 'Tâches',
                      habits: 'Habitudes',
                      focus: 'Focus'
                    };
                    return [value, labels[name] || name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      tasks: 'Tâches',
                      habits: 'Habitudes',
                      focus: 'Focus'
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="tasks" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="habits" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="focus" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          {insight && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm" dangerouslySetInnerHTML={{ 
                __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }} />
              {recommendation && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 {recommendation}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
