
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
