
import React from "react";
import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartLoading } from "./ChartLoading";
import { CustomTooltip } from "./CustomTooltip";
import { MultiLineChartProps } from "./types";

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  lines,
  width = 500,
  height = 300,
  xAxisDataKey = "name",
  strokeWidth = 2,
  loading = false,
  className,
  noDataMessage = "No data available",
  colors = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"],
}) => {
  // Handle empty data or loading state
  if (loading) {
    return <ChartLoading height={height} />;
  }

  if (!data || data.length === 0 || !lines || lines.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        {noDataMessage}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey={xAxisDataKey}
            tick={{ fill: "var(--chart-text, currentColor)" }}
            stroke="var(--chart-text, currentColor)"
            opacity={0.6}
          />
          <YAxis
            tick={{ fill: "var(--chart-text, currentColor)" }}
            stroke="var(--chart-text, currentColor)"
            opacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || colors[index % colors.length]}
              strokeWidth={strokeWidth}
              dot={{ fill: line.color || colors[index % colors.length] }}
              activeDot={{ r: 6, fill: line.color || colors[index % colors.length] }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
