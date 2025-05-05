
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "./types";
import { cn } from "@/lib/utils";
import { CustomTooltip } from "./CustomTooltip";

interface SimpleBarChartProps {
  data: ChartData[];
  barKey: string;
  tooltipTitle?: string;
  className?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  barKey = "total", 
  tooltipTitle = "Total", 
  className 
}) => {
  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
          <Bar 
            dataKey={barKey} 
            fill="var(--primary)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
