
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartData } from "./types";
import { cn } from "@/lib/utils";
import { CustomTooltip } from "./CustomTooltip";

interface SimplePieChartProps {
  data: ChartData[];
  className?: string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, className }) => {
  const COLORS = ["var(--primary)", "#10b981", "#0ea5e9", "#8b5cf6", "#ec4899"];

  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={30}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            align="center" 
            verticalAlign="bottom" 
            layout="horizontal" 
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
