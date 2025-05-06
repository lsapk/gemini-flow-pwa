
import React from 'react';
import { PieChart } from './PieChart';
import { ChartData, PieChartProps } from './types';

interface SimplePieChartProps {
  data: ChartData[];
  dataKey?: string;
  nameKey?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ 
  data, 
  dataKey = 'value', 
  nameKey = 'name',
  width = 400,
  height = 300,
  className
}) => {
  return (
    <PieChart
      data={data}
      dataKey={dataKey}
      nameKey={nameKey}
      width={width}
      height={height}
      className={className}
    />
  );
};
