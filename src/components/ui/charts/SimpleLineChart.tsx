
import React from "react";
import { LineChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimpleLineChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, height = 300 }) => {
  // Apply the height as a style using className instead of trying to pass it as a prop
  const className = `h-[${height}px]`;
  
  return (
    <LineChart
      data={data}
      xAxisKey="name"
      lines={[{ dataKey: "value", name: "Value", color: "var(--line-chart)" }]}
      className={className}
    />
  );
};
