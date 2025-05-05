
import React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartLoading } from "./ChartLoading";
import { CustomTooltip } from "./CustomTooltip";
import { AreaChartProps } from "./types";

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  width = 500,
  height = 300,
  dataKey = "value",
  xAxisDataKey = "name",
  areaOpacity = 0.3,
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
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            fillOpacity={areaOpacity}
            fill="url(#colorValue)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
