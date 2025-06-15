
import React from "react";
import { Progress } from "@/components/ui/progress";

interface BadgeProgressBarProps {
  label: string;
  value: number;
  total: number;
  color?: string;
}

export const BadgeProgressBar: React.FC<BadgeProgressBarProps> = ({
  label,
  value,
  total,
  color = "primary"
}) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="my-2">
      <div className="flex justify-between mb-1 text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        <span>{value}/{total}</span>
      </div>
      <Progress
        value={percent}
        className={`h-2 bg-gray-200 ${color === 'primary' ? 'bg-primary/10' : ''}`}
        barClassName={`transition-all duration-700 ${color === 'primary'
          ? 'bg-primary'
          : color === 'blue'
          ? 'bg-blue-500'
          : color === 'green'
          ? 'bg-green-500'
          : color === 'purple'
          ? 'bg-purple-500'
          : color === 'yellow'
          ? 'bg-yellow-400'
          : ''}`}
      />
    </div>
  );
};
