
import React from "react";
import { PieChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimplePieChartProps {
  data: ChartData[];
  height?: number;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, height = 300 }) => {
  // Apply the height as a style using className instead of trying to pass it as a prop
  const className = `h-[${height}px]`;
  
  return (
    <PieChart
      data={data}
      nameKey="name"
      valueKey="value"
      className={className}
    />
  );
};
