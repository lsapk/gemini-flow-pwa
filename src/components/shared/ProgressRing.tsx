import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { size: 32, fontSize: 'text-[10px]' },
  md: { size: 48, fontSize: 'text-xs' },
  lg: { size: 64, fontSize: 'text-sm' },
};

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 3.5,
  showLabel = true,
  className,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const radius = (config.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 100) return { stroke: 'stroke-green-500', glow: 'rgba(34,197,94,0.4)' };
    if (progress >= 75) return { stroke: 'stroke-emerald-500', glow: 'rgba(16,185,129,0.3)' };
    if (progress >= 50) return { stroke: 'stroke-yellow-500', glow: 'rgba(234,179,8,0.3)' };
    if (progress >= 25) return { stroke: 'stroke-orange-500', glow: 'rgba(249,115,22,0.3)' };
    return { stroke: 'stroke-red-500', glow: 'rgba(239,68,68,0.3)' };
  };

  const color = getColor();

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        <defs>
          <filter id={`glow-${size}-${Math.round(progress)}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color.glow} />
          </filter>
        </defs>
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/60"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={color.stroke}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ strokeDasharray: circumference }}
          filter={progress > 0 ? `url(#glow-${size}-${Math.round(progress)})` : undefined}
        />
      </svg>
      
      {showLabel && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className={cn(
            'absolute font-semibold text-foreground',
            config.fontSize
          )}
        >
          {Math.round(progress)}%
        </motion.span>
      )}
    </div>
  );
}
