
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartData } from "./types";
import { useMediaQuery } from "@/hooks/use-mobile";

// Couleurs par défaut pour le graphique
const DEFAULT_COLORS = ["#7C3AED", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];

interface SimplePieChartProps {
  data: ChartData[];
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  className?: string;
}

export const SimplePieChart = ({
  data,
  nameKey = "name",
  valueKey = "value",
  colors = DEFAULT_COLORS,
  className = "h-72"
}: SimplePieChartProps) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={isMobile ? 60 : 80}
            innerRadius={isMobile ? 30 : 40}
            paddingAngle={5}
            dataKey={valueKey}
            nameKey={nameKey}
            label={({ name, percent }) => 
              isMobile ? 
                `${(percent * 100).toFixed(0)}%` : 
                `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value, "Valeur"]} 
            contentStyle={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '0.5rem' : '0.75rem'
            }}
          />
          <Legend 
            layout={isMobile ? "horizontal" : "vertical"} 
            verticalAlign={isMobile ? "bottom" : "middle"} 
            align={isMobile ? "center" : "right"}
            wrapperStyle={isMobile ? { fontSize: '0.75rem' } : { fontSize: '0.875rem' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
