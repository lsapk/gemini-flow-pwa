
import React from "react";
import { LineChart } from "./LineChart";
import { ChartData } from "./types";

interface SimpleLineChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, height = 300 }) => {
  return (
    <LineChart
      data={data}
      xAxisDataKey="name"
      lineDataKey="value"
      height={height}
      color="var(--line-chart)"
    />
  );
};
