
import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { LineChartProps } from "./types";
import { CustomTooltip } from "./CustomTooltip";
import { ChartLoading } from "./ChartLoading";

// Line Chart Component
export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisKey = "name",
  lineKey = "value",
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
        <RechartsLineChart
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
          <Line 
            type="monotone" 
            dataKey={lineKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ r: 4, fill: color, stroke: color }}
            activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
