
import React from "react";
import { TooltipProps } from "recharts";

export const CustomTooltip: React.FC<TooltipProps<any, any> & { title?: string }> = ({ 
  active, 
  payload, 
  label,
  title = "Value" 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background shadow border border-border p-2 rounded-lg text-xs">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mt-1">
            <span className="text-muted-foreground">{item.name || title}:</span>
            <span className="font-mono font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
