
import React from "react";
import { PieChart } from "./PieChart";
import { ChartData } from "./types";

interface SimplePieChartProps {
  data: ChartData[];
  height?: number;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, height = 300 }) => {
  return (
    <PieChart
      data={data}
      dataKey="value"
      nameKey="name"
      height={height}
    />
  );
};
