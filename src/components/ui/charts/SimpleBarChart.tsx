
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "./types";
import { useMediaQuery } from "@/hooks/use-mobile";

interface SimpleBarChartProps {
  data: ChartData[];
  xAxisKey?: string;
  barKey?: string;
  color?: string;
  className?: string;
}

export const SimpleBarChart = ({
  data,
  xAxisKey = "name",
  barKey = "value",
  color = "#7C3AED",
  className = "h-72"
}: SimpleBarChartProps) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: isMobile ? -10 : 0,
            bottom: isMobile ? 0 : 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            dx={-10}
            width={isMobile ? 25 : 40}
          />
          <Tooltip 
            contentStyle={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '0.5rem' : '0.75rem'
            }} 
          />
          <Bar dataKey={barKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
