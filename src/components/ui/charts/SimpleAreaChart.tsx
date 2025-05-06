
import React from "react";
import { AreaChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimpleAreaChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({ data, height = 300 }) => {
  return (
    <AreaChart
      data={data}
      xAxisKey="name"
      areaKey="value"
      height={height}
      color="var(--area-chart)"
    />
  );
};
