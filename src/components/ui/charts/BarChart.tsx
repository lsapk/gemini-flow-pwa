
import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { BarChartProps } from "./types";
import { CustomTooltip } from "./CustomTooltip";
import { ChartLoading } from "./ChartLoading";

// Bar Chart Component
export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey = "name",
  barKey = "value",
  color = "#3b82f6",
  height = 300,
  className = "",
  loading = false,
  tooltipTitle
}) => {
  if (loading || !data || data.length === 0) {
    return <ChartLoading height={height} />;
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} title={tooltipTitle} />} />
          <Bar dataKey={barKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
