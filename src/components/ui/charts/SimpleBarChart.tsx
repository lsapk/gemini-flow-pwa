
import React from "react";
import { BarChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimpleBarChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, height = 300 }) => {
  return (
    <BarChart
      data={data}
      xAxisKey="name"
      barKey="value"
      height={height}
      color="var(--bar-chart)"
    />
  );
};
