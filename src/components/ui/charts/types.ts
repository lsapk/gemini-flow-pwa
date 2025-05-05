
import React, { CSSProperties } from "react";
import { TooltipProps as RechartsTooltipProps } from "recharts";

// Define CustomTooltipProps
export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  title?: string;
}

// Define chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface MultiLineChartDataPoint {
  name: string;
  [key: string]: any;
}

// Define common chart props
export interface CommonChartProps {
  data: ChartDataPoint[] | MultiLineChartDataPoint[];
  width?: number;
  height?: number;
  loading?: boolean;
  className?: string;
  noDataMessage?: string;
  colors?: string[];
}

// Define specific chart props
export interface AreaChartProps extends CommonChartProps {
  dataKey?: string;
  xAxisDataKey?: string;
  areaOpacity?: number;
}

export interface BarChartProps extends CommonChartProps {
  dataKey?: string;
  xAxisDataKey?: string;
  barSize?: number;
}

export interface LineChartProps extends CommonChartProps {
  dataKey?: string;
  xAxisDataKey?: string;
  strokeWidth?: number;
}

export interface MultiLineChartProps extends CommonChartProps {
  lines: { key: string; name: string; color?: string }[];
  xAxisDataKey?: string;
  strokeWidth?: number;
}

export interface PieChartProps extends CommonChartProps {
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
}
