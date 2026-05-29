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

  const chartData = hourlyData
    .filter(h => h.hour >= 5 && h.hour <= 23)
    .map(h => ({
      ...h,
      name: `${h.hour}h`,
      isPeak: h.hour === peakHour
    }));

  // Safely render insight text — strip any HTML tags to prevent XSS
  const sanitizedInsight = insight.replace(/<[^>]*>/g, '').replace(/\*\*(.*?)\*\*/g, '$1');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Chronobiologie
            </CardTitle>
            <Badge className={`${TYPE_COLORS[productivityType]} text-white border-none rounded-full px-3 py-1 font-bold text-[10px]`}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {TYPE_LABELS[productivityType].toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Time Distribution Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Matin', val: stats.morningPercent, icon: Sunrise, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { label: 'Après-midi', val: stats.afternoonPercent, icon: Sun, color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { label: 'Soir', val: stats.eveningPercent, icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <s.icon className={`h-4 w-4 mx-auto ${s.color} mb-1.5`} />
                <div className="text-lg font-black">{s.val}%</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#888' }}
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '11px', color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { tasks: 'Tâches', habits: 'Habitudes', focus: 'Focus' };
                    return [value, labels[name] || name];
                  }}
                />
                <Bar dataKey="tasks" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} barSize={12} />
                <Bar dataKey="habits" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} barSize={12} />
                <Bar dataKey="focus" stackId="a" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          {sanitizedInsight && (
            <div className="mt-6 p-4 bg-white/5 rounded-[1.5rem] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <p className="text-sm font-bold text-white/90 leading-relaxed">{sanitizedInsight}</p>
              {recommendation && (
                <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                  <span className="text-primary text-base">●</span>
                  {recommendation.replace(/<[^>]*>/g, '')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
