
import React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Shared interface for chart data
interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Base chart props
interface BaseChartProps {
  data: ChartData[];
  height?: number;
  className?: string;
  loading?: boolean;
}

// Bar chart specific props
interface BarChartProps extends BaseChartProps {
  xAxisKey?: string;
  barKey?: string;
  color?: string;
  tooltipTitle?: string;
}

// Area chart specific props
interface AreaChartProps extends BaseChartProps {
  xAxisKey?: string;
  areaKey?: string;
  color?: string;
  tooltipTitle?: string;
}

// Line chart specific props
interface LineChartProps extends BaseChartProps {
  xAxisKey?: string;
  lineKey?: string;
  color?: string;
  tooltipTitle?: string;
}

// Pie chart specific props
interface PieChartProps extends BaseChartProps {
  nameKey?: string;
  dataKey?: string;
  colors?: string[];
  tooltipTitle?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, title }: TooltipProps & { title?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-2 shadow-md text-sm">
        <p className="font-medium">{title || "Value"}: {payload[0].value}</p>
        <p className="text-muted-foreground">{label}</p>
      </div>
    );
  }
  return null;
};

// Loading state component
const ChartLoading = ({ height = 300 }: { height?: number }) => (
  <div className="flex items-center justify-center" style={{ height }}>
    <Skeleton className="h-[80%] w-[90%]" />
  </div>
);

// Bar Chart Component
export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey = "name",
  barKey = "value",
  color = "#3b82f6",
  height = 300,
  className = "",
  loading = false,
  tooltipTitle
}) => {
  if (loading || !data || data.length === 0) {
    return <ChartLoading height={height} />;
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <Tooltip content={<CustomTooltip title={tooltipTitle} />} />
          <Bar dataKey={barKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Area Chart Component
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xAxisKey = "name",
  areaKey = "value",
  color = "#3b82f6",
  height = 300,
  className = "",
  loading = false,
  tooltipTitle
}) => {
  if (loading || !data || data.length === 0) {
    return <ChartLoading height={height} />;
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <Tooltip content={<CustomTooltip title={tooltipTitle} />} />
          <Area 
            type="monotone" 
            dataKey={areaKey} 
            stroke={color} 
            fill={color} 
            fillOpacity={0.2} 
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Line Chart Component
export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisKey = "name",
  lineKey = "value",
  color = "#3b82f6",
  height = 300,
  className = "",
  loading = false,
  tooltipTitle
}) => {
  if (loading || !data || data.length === 0) {
    return <ChartLoading height={height} />;
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <Tooltip content={<CustomTooltip title={tooltipTitle} />} />
          <Line 
            type="monotone" 
            dataKey={lineKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ r: 4, fill: color, stroke: color }}
            activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Pie Chart Component
export const PieChart: React.FC<PieChartProps> = ({
  data,
  nameKey = "name",
  dataKey = "value",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  height = 300,
  className = "",
  loading = false,
  tooltipTitle
}) => {
  if (loading || !data || data.length === 0) {
    return <ChartLoading height={height} />;
  }

  // Generate colors for each segment
  const pieColors = data.map((_, index) => colors[index % colors.length]);

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip title={tooltipTitle} />} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Card wrappers for the charts
export const BarChartCard = ({ title, ...props }: BarChartProps & { title: string }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <BarChart {...props} />
    </CardContent>
  </Card>
);

export const AreaChartCard = ({ title, ...props }: AreaChartProps & { title: string }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <AreaChart {...props} />
    </CardContent>
  </Card>
);

export const LineChartCard = ({ title, ...props }: LineChartProps & { title: string }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <LineChart {...props} />
    </CardContent>
  </Card>
);

export const PieChartCard = ({ title, ...props }: PieChartProps & { title: string }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <PieChart {...props} />
    </CardContent>
  </Card>
);
