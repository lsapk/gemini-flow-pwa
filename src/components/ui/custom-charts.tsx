
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
  Cell
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ChartProps {
  data: Array<{
    name: string;
    total: number;
  }>;
  tooltipTitle?: string;
}

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  tooltipTitle?: string;
  colors?: string[];
}

export const BarChart: React.FC<ChartProps> = ({ data, tooltipTitle = "Value" }) => {
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
      className="h-[200px]"
    >
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
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const AreaChart: React.FC<ChartProps> = ({ data, tooltipTitle = "Value" }) => {
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
      className="h-[200px]"
    >
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
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ data, tooltipTitle = "Value", colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1'] }) => {
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
      className="h-[200px]"
    >
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
