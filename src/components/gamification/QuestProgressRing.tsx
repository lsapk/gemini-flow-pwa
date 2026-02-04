import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuestProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  glowColor?: string;
}

export function QuestProgressRing({
  progress,
  size = 56,
  strokeWidth = 4,
  className,
  glowColor = 'hsl(var(--primary))',
}: QuestProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const isComplete = progress >= 100;

  // Color based on progress
  const getColor = () => {
    if (progress >= 100) return '#22c55e'; // green-500
    if (progress >= 75) return '#10b981'; // emerald-500
    if (progress >= 50) return '#f59e0b'; // amber-500
    if (progress >= 25) return '#f97316'; // orange-500
    return '#6366f1'; // indigo-500
  };

  const strokeColor = getColor();

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/30"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#gradient-${size})`}
          filter={isComplete ? `url(#glow-${size})` : undefined}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute flex flex-col items-center justify-center"
      >
        <span 
          className="font-heading text-sm"
          style={{ color: strokeColor }}
        >
          {Math.round(progress)}%
        </span>
      </motion.div>

      {/* Completion effect */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0.8] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 20px ${strokeColor}80`,
          }}
        />
      )}
    </div>
  );
}
