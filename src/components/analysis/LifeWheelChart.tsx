import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLifeWheelData } from "@/hooks/useLifeWheelData";
import { motion } from "framer-motion";
import { Compass, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from "recharts";

export function LifeWheelChart() {
  const { data, isLoading } = useLifeWheelData();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.data || [];
  const balance = data?.balance || 0;

  const getBalanceInfo = (balance: number) => {
    if (balance >= 80) return { label: 'Excellent équilibre', color: 'bg-green-500' };
    if (balance >= 60) return { label: 'Bon équilibre', color: 'bg-blue-500' };
    if (balance >= 40) return { label: 'À améliorer', color: 'bg-yellow-500' };
    return { label: 'Déséquilibré', color: 'bg-orange-500' };
  };

  const balanceInfo = getBalanceInfo(balance);

  // Find weakest and strongest categories
  const sorted = [...chartData].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-none bg-card/40 backdrop-blur-xl rounded-[2.5rem]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              Roue de la Vie
            </CardTitle>
            <Badge className={`${balanceInfo.color} text-white border-none rounded-full px-3 py-1 font-bold text-[10px]`}>
              {balanceInfo.label.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  formatter={(value: number, name: string, props: any) => [
                    <div key="tooltip" className="space-y-1">
                      <div className="font-black text-lg">{value}%</div>
                      <div className="text-[10px] text-white/60 font-bold uppercase">
                        {props.payload.habits} habitudes • {props.payload.goals} objectifs
                      </div>
                    </div>,
                    ""
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {strongest && strongest.score > 0 && (
              <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Point fort</p>
                <p className="text-sm font-black text-emerald-400">
                  {strongest.category}
                </p>
                <p className="text-xs font-bold">{strongest.score}%</p>
              </div>
            )}
            {weakest && weakest.score < 100 && (
              <div className="p-3 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1">À développer</p>
                <p className="text-sm font-black text-orange-400">
                  {weakest.category}
                </p>
                <p className="text-xs font-bold">{weakest.score}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
