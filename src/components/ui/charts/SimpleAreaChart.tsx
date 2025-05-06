
import React from "react";
import { AreaChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimpleAreaChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({ data, height = 300 }) => {
  // Apply the height as a style using className instead of trying to pass it as a prop
  const className = `h-[${height}px]`;
  
  return (
    <AreaChart
      data={data}
      xAxisKey="name"
      areaKey="value"
      color="var(--area-chart)"
      className={className}
    />
  );
};
