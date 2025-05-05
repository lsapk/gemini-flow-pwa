
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Area, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart as RechartsAreaChart, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface ChartConfig {
  total?: {
    label: string;
    theme: {
      light: string;
      dark: string;
    }
  };
  value?: {
    label: string;
    theme: {
      light: string;
      dark: string;
    }
  };
}

interface ChartProps {
  config: ChartConfig;
  children: React.ReactNode;
  className?: string;
}

export const SimpleAreaChart = ({ 
  data,
  xAxisKey = "name",
  areaKey = "value", 
  color = "#3b82f6",
  className,
  tooltipTitle,
  height = 200
}: { 
  data: any[]; 
  xAxisKey?: string;
  areaKey?: string;
  color?: string;
  className?: string;
  tooltipTitle?: string;
  height?: number;
}) => {
  return (
    <div className={cn(`h-[${height}px] w-full`, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={xAxisKey}
            className="text-xs fill-muted-foreground" 
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            formatter={(value: any, name: any) => [value, tooltipTitle || name]}
          />
          <Area 
            type="monotone" 
            dataKey={areaKey} 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SimpleBarChart = ({
  data,
  xAxisKey = "name",
  barKey = "value",
  color = "#3b82f6",
  className,
  tooltipTitle,
  height = 200
}: {
  data: any[];
  xAxisKey?: string;
  barKey?: string;
  color?: string;
  className?: string;
  tooltipTitle?: string;
  height?: number;
}) => {
  return (
    <div className={cn(`h-[${height}px] w-full`, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={xAxisKey}
            className="text-xs fill-muted-foreground" 
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            formatter={(value: any, name: any) => [value, tooltipTitle || name]}
          />
          <Bar 
            dataKey={barKey} 
            fill={color} 
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SimplePieChart = ({
  data,
  nameKey = "name",
  valueKey = "value",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  className,
  height = 200
}: {
  data: any[];
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  className?: string;
  height?: number;
}) => {
  return (
    <div className={cn(`h-[${height}px] w-full`, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }} 
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Added the SimpleLineChart component
export const SimpleLineChart = ({
  data,
  xAxisKey = "name",
  lines = [{ dataKey: "value", name: "Value", color: "#3b82f6" }],
  className,
  height = 200
}: {
  data: any[];
  xAxisKey?: string;
  lines?: { dataKey: string; name: string; color: string }[];
  className?: string;
  height?: number;
}) => {
  return (
    <div className={cn(`h-[${height}px] w-full`, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={xAxisKey}
            className="text-xs fill-muted-foreground" 
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }} 
          />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              stroke={line.color}
              name={line.name} 
              activeDot={{ r: 8 }} 
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Explicitly export the components to fix TypeScript errors
export { SimpleAreaChart as AreaChart };
export { SimpleBarChart as BarChart };
export { SimplePieChart as PieChart };
export { SimpleLineChart as LineChart };
