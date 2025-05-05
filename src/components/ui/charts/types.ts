
// Basic types for chart components
export interface ChartData {
  name: string;
  value?: number;
  total?: number;
  high?: number;
  low?: number;
  [key: string]: any;
}

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
}

// Props for MultiLineChart
export interface MultiLineChartProps {
  data: ChartData[];
  lines: {
    key: string;
    name: string;
    color?: string;
  }[];
  width?: number;
  height?: number;
  xAxisDataKey?: string;
  strokeWidth?: number;
  loading?: boolean;
  className?: string;
  noDataMessage?: string;
  colors?: string[];
}

// Props for BarChart
export interface BarChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  dataKey?: string;
  xAxisDataKey?: string;
  barSize?: number;
  loading?: boolean;
  className?: string;
  noDataMessage?: string;
  colors?: string[];
}

// Props for LineChart
export interface LineChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  dataKey?: string;
  xAxisDataKey?: string;
  strokeWidth?: number;
  loading?: boolean;
  className?: string;
  noDataMessage?: string;
  colors?: string[];
}

// Props for AreaChart
export interface AreaChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  dataKey?: string;
  xAxisDataKey?: string;
  areaOpacity?: number;
  loading?: boolean;
  className?: string;
  noDataMessage?: string;
  colors?: string[];
}

// Props for PieChart
export interface PieChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  loading?: boolean;
  className?: string;
  noDataMessage?: string;
  colors?: string[];
}
