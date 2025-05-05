
import React from "react";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart as RechartsAreaChart, 
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ChartProps {
  data: Array<{
    name: string;
    total: number;
  }>;
  tooltipTitle?: string;
  height?: string | number;
  className?: string;
  loading?: boolean;
}

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  tooltipTitle?: string;
  colors?: string[];
  height?: string | number;
  className?: string;
  loading?: boolean;
}

interface MultiLineChartProps {
  data: any[];
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  xAxisDataKey?: string;
  height?: string | number;
  className?: string;
  loading?: boolean;
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
  </div>
);

export const BarChart: React.FC<ChartProps> = ({ 
  data, 
  tooltipTitle = "Valeur", 
  height = "200px",
  className = "",
  loading = false
}) => {
  return (
    <ChartContainer
      config={{
        total: {
          label: tooltipTitle,
          theme: {
            light: "#0ea5e9",
            dark: "#0ea5e9",
          },
        },
      }}
      className={`h-[${height}] ${className} relative`}
    >
      {loading && <LoadingOverlay />}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <ChartTooltipContent
                    label={tooltipTitle}
                    payload={payload}
                  />
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="total" 
            fill="var(--color-total)" 
            radius={[4, 4, 0, 0]} 
            animationDuration={500}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const AreaChart: React.FC<ChartProps> = ({ 
  data, 
  tooltipTitle = "Valeur", 
  height = "200px",
  className = "",
  loading = false
}) => {
  return (
    <ChartContainer
      config={{
        total: {
          label: tooltipTitle,
          theme: {
            light: "#0ea5e9",
            dark: "#0ea5e9",
          },
        },
      }}
      className={`h-[${height}] ${className} relative`}
    >
      {loading && <LoadingOverlay />}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <ChartTooltipContent
                    label={tooltipTitle}
                    payload={payload}
                  />
                );
              }
              return null;
            }}
          />
          <Area
            dataKey="total"
            stroke="var(--color-total)"
            fill="var(--color-total)"
            fillOpacity={0.2}
            animationDuration={500}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const LineChart: React.FC<MultiLineChartProps> = ({ 
  data, 
  lines,
  xAxisDataKey = "name",
  height = "200px",
  className = "",
  loading = false
}) => {
  return (
    <div className={`h-[${height}] ${className} relative`}>
      {loading && <LoadingOverlay />}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisDataKey} 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              activeDot={{ r: 8 }}
              animationDuration={500}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  tooltipTitle = "Valeur", 
  colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
  height = "200px",
  className = "",
  loading = false
}) => {
  return (
    <ChartContainer
      config={{
        value: {
          label: tooltipTitle,
          theme: {
            light: "#0ea5e9",
            dark: "#0ea5e9",
          },
        },
      }}
      className={`h-[${height}] ${className} relative`}
    >
      {loading && <LoadingOverlay />}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="var(--color-value)"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <ChartTooltipContent
                    label={payload[0].name}
                    payload={[{ ...payload[0], dataKey: 'value' }]}
                  />
                );
              }
              return null;
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
