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
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              Roue de la Vie
            </CardTitle>
            <Badge className={`${balanceInfo.color} text-white`}>
              {balanceInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ 
                    fontSize: 11, 
                    fill: 'hsl(var(--muted-foreground))' 
                  }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    <div key="tooltip" className="space-y-1">
                      <div className="font-medium">{value}%</div>
                      <div className="text-xs text-muted-foreground">
                        {props.payload.habits} habitudes • {props.payload.goals} objectifs
                      </div>
                    </div>,
                    props.payload.category
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {strongest && strongest.score > 0 && (
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xs text-muted-foreground">Point fort</p>
                <p className="font-medium text-green-600 dark:text-green-400">
                  {strongest.category} ({strongest.score}%)
                </p>
              </div>
            )}
            {weakest && weakest.score < 100 && (
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-xs text-muted-foreground">À développer</p>
                <p className="font-medium text-orange-600 dark:text-orange-400">
                  {weakest.category} ({weakest.score}%)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
