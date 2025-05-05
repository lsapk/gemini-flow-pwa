
import React from "react";
import { CustomTooltipProps } from "./types";

// Custom tooltip component
export const CustomTooltip = ({ active, payload, label, title }: CustomTooltipProps) => {
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
