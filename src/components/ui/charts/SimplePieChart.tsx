
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartData } from "./types";

// Couleurs par défaut pour le graphique
const DEFAULT_COLORS = ["#7C3AED", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];

interface SimplePieChartProps {
  data: ChartData[];
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  className?: string;
}

export const SimplePieChart = ({
  data,
  nameKey = "name",
  valueKey = "value",
  colors = DEFAULT_COLORS,
  className = "h-72"
}: SimplePieChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            paddingAngle={5}
            dataKey={valueKey}
            nameKey={nameKey}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, "Valeur"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
