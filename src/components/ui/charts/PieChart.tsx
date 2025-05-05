
import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { PieChartProps } from "./types";
import { CustomTooltip } from "./CustomTooltip";
import { ChartLoading } from "./ChartLoading";

// Pie Chart Component
export const PieChart: React.FC<PieChartProps> = ({
  data,
  nameKey = "name",
  dataKey = "value",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  height = 300,
  className = "",
  loading = false,
  tooltipTitle
}) => {
  if (loading || !data || data.length === 0) {
    return <ChartLoading height={height} />;
  }

  // Generate colors for each segment
  const pieColors = data.map((_, index) => colors[index % colors.length]);

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index]} />
            ))}
          </Pie>
          <Tooltip content={(props) => <CustomTooltip {...props} title={tooltipTitle} />} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
