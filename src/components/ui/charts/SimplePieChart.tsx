
import React from "react";
import { PieChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimplePieChartProps {
  data: ChartData[];
  height?: number;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, height = 300 }) => {
  return (
    <PieChart
      data={data}
      nameKey="name"
      valueKey="value"
      height={height}
    />
  );
};
