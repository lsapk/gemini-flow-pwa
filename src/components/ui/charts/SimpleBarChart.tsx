
import React from "react";
import { BarChart } from "./BarChart";
import { ChartData } from "./types";

interface SimpleBarChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, height = 300 }) => {
  return (
    <BarChart
      data={data}
      xAxisDataKey="name"
      barDataKey="value"
      height={height}
      color="var(--bar-chart)"
    />
  );
};
