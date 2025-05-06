
import React from "react";
import { AreaChart } from "./AreaChart";
import { ChartData, AreaChartProps } from "./types";

interface SimpleAreaChartProps {
  data: ChartData[];
  height?: number;
}

export const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({ data, height = 300 }) => {
  return (
    <AreaChart
      data={data}
      xAxisDataKey="name"
      areaDataKey="value"
      height={height}
      color="var(--area-chart)"
    />
  );
};
