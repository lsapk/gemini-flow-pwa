
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartData, LineConfig } from "./types";
import { cn } from "@/lib/utils";
import { CustomTooltip } from "./CustomTooltip";

interface SimpleLineChartProps {
  data: ChartData[];
  lines: LineConfig[];
  className?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  data, 
  lines,
  className 
}) => {
  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            align="center" 
            verticalAlign="bottom" 
            layout="horizontal" 
            iconType="line"
            iconSize={10}
          />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              stroke={line.color} 
              name={line.name}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
