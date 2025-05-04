
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
  Area 
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ChartProps {
  data: Array<{
    name: string;
    total: number;
  }>;
  tooltipTitle?: string;
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
