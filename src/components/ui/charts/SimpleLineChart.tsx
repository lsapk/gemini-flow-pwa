
import React from "react";
import { LineChart } from "@/components/ui/custom-charts";
import { ChartData } from "./types";

interface SimpleLineChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, height = 300 }) => {
  return (
    <LineChart
      data={data}
      xAxisKey="name"
      lines={[{ dataKey: "value", name: "Value", color: "var(--line-chart)" }]}
      height={height}
    />
  );
};
