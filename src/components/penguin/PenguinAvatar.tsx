import { motion } from "framer-motion";

interface PenguinAvatarProps {
  stage: 'egg' | 'chick' | 'explorer' | 'emperor';
  size?: 'sm' | 'md' | 'lg';
  accessories?: string[];
  animated?: boolean;
}

const STAGE_CONFIG = {
  egg: {
    emoji: '🥚',
    bg: 'from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700',
    label: 'Œuf',
  },
  chick: {
    emoji: '🐣',
    bg: 'from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-800',
    label: 'Poussin',
  },
  explorer: {
    emoji: '🐧',
    bg: 'from-blue-300 to-indigo-400 dark:from-blue-700 dark:to-indigo-800',
    label: 'Explorateur',
  },
  emperor: {
    emoji: '🐧',
    bg: 'from-indigo-400 to-purple-500 dark:from-indigo-700 dark:to-purple-800',
    label: 'Empereur',
  },
};

const SIZE_MAP = {
  sm: 'w-16 h-16 text-2xl',
  md: 'w-24 h-24 text-4xl',
  lg: 'w-36 h-36 text-6xl',
};

export const PenguinAvatar = ({ stage, size = 'md', accessories = [], animated = true }: PenguinAvatarProps) => {
  const config = STAGE_CONFIG[stage];
  const sizeClasses = SIZE_MAP[size];

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      animate={animated ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.bg} blur-xl opacity-30`} />
      
      {/* Main avatar */}
      <div className={`relative ${sizeClasses} rounded-full bg-gradient-to-br ${config.bg} flex items-center justify-center shadow-lg border-2 border-white/20`}>
        <span className="drop-shadow-md">{config.emoji}</span>
        
        {/* Emperor crown */}
        {stage === 'emperor' && (
          <span className="absolute -top-2 text-lg">👑</span>
        )}
        
        {/* Accessories */}
        {accessories.includes('scarf_red') && (
          <span className="absolute -bottom-1 text-sm">🧣</span>
        )}
        {accessories.includes('hat_explorer') && (
          <span className="absolute -top-3 text-sm">🎩</span>
        )}
        {accessories.includes('glasses_cool') && (
          <span className="absolute top-1/3 text-xs">🕶️</span>
        )}
      </div>
      
      {/* Stage label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border/30">
          {config.label}
        </span>
      </div>
    </motion.div>
  );
};
