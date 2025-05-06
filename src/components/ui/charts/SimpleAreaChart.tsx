
import React from "react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart } from "recharts";
import { ChartData } from "./types";

interface SimpleAreaChartProps {
  data: ChartData[];
  xAxisKey?: string;
  areaKey?: string;
  color?: string;
  className?: string;
}

export const SimpleAreaChart = ({
  data,
  xAxisKey = "name",
  areaKey = "value",
  color = "#7C3AED",
  className = "h-72"
}: SimpleAreaChartProps) => {
  return (
    <div className={className}>
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
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            dx={-10}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey={areaKey}
            stroke={color}
            fill={color}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
