
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart } from "./BarChart";
import { AreaChart } from "./AreaChart";
import { LineChart } from "./LineChart";
import { PieChart } from "./PieChart";
import { BarChartProps, AreaChartProps, LineChartProps, PieChartProps } from "./types";

// Card wrappers for the charts
export const BarChartCard: React.FC<BarChartProps & { title: string }> = ({ title, ...props }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <BarChart {...props} />
    </CardContent>
  </Card>
);

export const AreaChartCard: React.FC<AreaChartProps & { title: string }> = ({ title, ...props }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <AreaChart {...props} />
    </CardContent>
  </Card>
);

export const LineChartCard: React.FC<LineChartProps & { title: string }> = ({ title, ...props }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <LineChart {...props} />
    </CardContent>
  </Card>
);

export const PieChartCard: React.FC<PieChartProps & { title: string }> = ({ title, ...props }) => (
  <Card>
    <CardContent className="pt-6">
      <h3 className="font-medium mb-3">{title}</h3>
      <PieChart {...props} />
    </CardContent>
  </Card>
);
