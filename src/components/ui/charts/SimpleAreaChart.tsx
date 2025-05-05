
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "./types";
import { cn } from "@/lib/utils";
import { CustomTooltip } from "./CustomTooltip";

interface SimpleAreaChartProps {
  data: ChartData[];
  areaKey: string;
  tooltipTitle?: string;
  className?: string;
}

export const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({ 
  data, 
  areaKey = "total", 
  tooltipTitle = "Total", 
  className 
}) => {
  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }} 
            tickLine={false} 
            axisLine={{ opacity: 0.1 }} 
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip title={tooltipTitle} />} />
          <Area 
            type="monotone" 
            dataKey={areaKey} 
            stroke="var(--primary)" 
            fill="var(--primary)" 
            fillOpacity={0.1} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
