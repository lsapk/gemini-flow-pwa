
import React from 'react';
import { LineChart } from './LineChart';
import { ChartData, LineChartProps } from './types';

interface SimpleLineChartProps {
  data: ChartData[];
  dataKey?: string;
  xAxisDataKey?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  data, 
  dataKey = 'value', 
  xAxisDataKey = 'name',
  width = 600,
  height = 300,
  className
}) => {
  return (
    <LineChart
      data={data}
      dataKey={dataKey}
      xAxisDataKey={xAxisDataKey}
      width={width}
      height={height}
      className={className}
    />
  );
};
