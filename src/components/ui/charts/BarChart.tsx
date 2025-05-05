
import React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartLoading } from "./ChartLoading";
import { CustomTooltip } from "./CustomTooltip";
import { BarChartProps } from "./types";

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 500,
  height = 300,
  dataKey = "value",
  xAxisDataKey = "name",
  barSize = 30,
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
        <RechartsBarChart
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
          <Bar dataKey={dataKey} fill={colors[0]} barSize={barSize} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
