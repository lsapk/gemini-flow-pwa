
import React from "react";
import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartLoading } from "./ChartLoading";
import { CustomTooltip } from "./CustomTooltip";
import { LineChartProps } from "./types";

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 500,
  height = 300,
  dataKey = "value",
  xAxisDataKey = "name",
  strokeWidth = 2,
  loading = false,
  className,
  noDataMessage = "No data available",
  colors = ["var(--chart-primary, #3498db)"],
}) => {
  // Handle empty data or loading state
  if (loading) {
    return <ChartLoading height={height} />;
  }

  if (!data || data.length === 0) {
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
          <Tooltip content={<CustomTooltip title={dataKey} />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            dot={{ fill: colors[0] }}
            activeDot={{ r: 6, fill: colors[0] }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
