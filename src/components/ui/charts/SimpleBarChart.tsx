
import React from "react";
import { BarChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimpleBarChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, height = 300 }) => {
  // Apply the height as a style using className instead of trying to pass it as a prop
  const className = `h-[${height}px]`;
  
  return (
    <BarChart
      data={data}
      xAxisKey="name"
      barKey="value"
      color="var(--bar-chart)"
      className={className}
    />
  );
};
