
import React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { AreaChartProps } from "./types";
import { CustomTooltip } from "./CustomTooltip";
import { ChartLoading } from "./ChartLoading";

// Area Chart Component
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xAxisKey = "name",
  areaKey = "value",
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
        <RechartsAreaChart
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
          <Area 
            type="monotone" 
            dataKey={areaKey} 
            stroke={color} 
            fill={color} 
            fillOpacity={0.2} 
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
