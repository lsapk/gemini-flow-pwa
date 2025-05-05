
import React from 'react';
import { AreaChart, AreaChartProps } from './AreaChart';
import { ChartData } from './types';

interface SimpleAreaChartProps {
  data: ChartData[];
  dataKey?: string;
  xAxisDataKey?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({ 
  data, 
  dataKey = 'value', 
  xAxisDataKey = 'name',
  width = 600,
  height = 300,
  className
}) => {
  return (
    <AreaChart
      data={data}
      dataKey={dataKey}
      xAxisDataKey={xAxisDataKey}
      width={width}
      height={height}
      className={className}
    />
  );
};
