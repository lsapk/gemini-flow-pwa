
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any; // Pour permettre d'autres propriétés
}

export interface BarChartProps {
  data: ChartData[];
  xAxisDataKey?: string;
  barDataKey?: string;
  color?: string;
  height?: number;
}

export interface LineChartProps {
  data: ChartData[];
  xAxisDataKey?: string;
  lineDataKey?: string;
  color?: string;
  height?: number;
}

export interface AreaChartProps {
  data: ChartData[];
  xAxisDataKey?: string;
  areaDataKey?: string;
  color?: string;
  height?: number;
}

export interface PieChartProps {
  data: ChartData[];
  dataKey?: string;
  nameKey?: string;
  height?: number;
}

export interface MultiLineChartProps {
  data: ChartData[];
  xAxisDataKey: string;
  lines: {
    dataKey: string;
    color: string;
    name?: string;
  }[];
  height?: number;
}
