
import React from "react";
import {
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartLoading } from "./ChartLoading";
import { CustomTooltip } from "./CustomTooltip";
import { PieChartProps } from "./types";

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 500,
  height = 300,
  dataKey = "value",
  nameKey = "name",
  innerRadius = 0,
  outerRadius = 80,
  loading = false,
  className,
  noDataMessage = "No data available",
  colors = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#d35400", "#7f8c8d"],
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
        <RechartsPieChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <Tooltip content={<CustomTooltip title={dataKey} />} />
          <Legend />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
