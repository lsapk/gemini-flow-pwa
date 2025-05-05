
import { CSSProperties } from "react";
import { Formatter, TooltipProps } from "recharts";

// Shared interface for chart data
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Base chart props
export interface BaseChartProps {
  data: ChartData[];
  height?: number;
  className?: string;
  loading?: boolean;
}

// Bar chart specific props
export interface BarChartProps extends BaseChartProps {
  xAxisKey?: string;
  barKey?: string;
  color?: string;
  tooltipTitle?: string;
}

// Area chart specific props
export interface AreaChartProps extends BaseChartProps {
  xAxisKey?: string;
  areaKey?: string;
  color?: string;
  tooltipTitle?: string;
}

// Line chart specific props
export interface LineChartProps extends BaseChartProps {
  xAxisKey?: string;
  lineKey?: string;
  color?: string;
  tooltipTitle?: string;
}

// Line chart with multiple lines props
export interface MultiLineChartProps extends BaseChartProps {
  xAxisKey?: string;
  lines?: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  tooltipTitle?: string;
}

// Pie chart specific props
export interface PieChartProps extends BaseChartProps {
  nameKey?: string;
  dataKey?: string;
  colors?: string[];
  tooltipTitle?: string;
}

// Custom tooltip props
export type CustomTooltipProps = TooltipProps<number, string> & { 
  title?: string 
};
