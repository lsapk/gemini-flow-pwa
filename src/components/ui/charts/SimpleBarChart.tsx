
import React from 'react';
import { BarChart } from './BarChart';
import { ChartData, BarChartProps } from './types';

interface SimpleBarChartProps {
  data: ChartData[];
  dataKey?: string;
  xAxisDataKey?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  dataKey = 'value', 
  xAxisDataKey = 'name',
  width = 600,
  height = 300,
  className
}) => {
  return (
    <BarChart
      data={data}
      dataKey={dataKey}
      xAxisDataKey={xAxisDataKey}
      width={width}
      height={height}
      className={className}
    />
  );
};
