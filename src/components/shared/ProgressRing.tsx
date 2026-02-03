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
  strokeWidth = 4,
  showLabel = true,
  className,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const radius = (config.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Determine color based on progress
  const getColor = () => {
    if (progress >= 100) return 'stroke-green-500';
    if (progress >= 75) return 'stroke-emerald-500';
    if (progress >= 50) return 'stroke-yellow-500';
    if (progress >= 25) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getColor()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {showLabel && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
