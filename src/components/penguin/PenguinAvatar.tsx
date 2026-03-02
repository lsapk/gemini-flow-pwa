import { motion } from "framer-motion";
import penguinMascot from "@/assets/penguin-mascot.png";

interface PenguinAvatarProps {
  stage: 'egg' | 'chick' | 'explorer' | 'emperor';
  size?: 'sm' | 'md' | 'lg';
  accessories?: string[];
  animated?: boolean;
}

const STAGE_CONFIG = {
  egg: {
    emoji: '🥚',
    useMascot: false,
    bg: 'from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700',
    label: 'Œuf',
  },
  chick: {
    emoji: '🐣',
    useMascot: false,
    bg: 'from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-800',
    label: 'Poussin',
  },
  explorer: {
    emoji: null,
    useMascot: true,
    bg: 'from-blue-300 to-indigo-400 dark:from-blue-700 dark:to-indigo-800',
    label: 'Explorateur',
  },
  emperor: {
    emoji: null,
    useMascot: true,
    bg: 'from-indigo-400 to-purple-500 dark:from-indigo-700 dark:to-purple-800',
    label: 'Empereur',
  },
};

const SIZE_MAP = {
  sm: { container: 'w-16 h-16', text: 'text-2xl', img: 'w-14 h-14' },
  md: { container: 'w-24 h-24', text: 'text-4xl', img: 'w-20 h-20' },
  lg: { container: 'w-36 h-36', text: 'text-6xl', img: 'w-32 h-32' },
};

export const PenguinAvatar = ({ stage, size = 'md', accessories = [], animated = true }: PenguinAvatarProps) => {
  const config = STAGE_CONFIG[stage];
  const sizeConfig = SIZE_MAP[size];

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      animate={animated ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.bg} blur-xl opacity-30`} />
      
      {/* Main avatar */}
      <div className={`relative ${sizeConfig.container} rounded-full bg-gradient-to-br ${config.bg} flex items-center justify-center shadow-lg border-2 border-white/20 overflow-hidden`}>
        {config.useMascot ? (
          <img 
            src={penguinMascot} 
            alt={config.label} 
            className={`${sizeConfig.img} object-contain drop-shadow-md`}
          />
        ) : (
          <span className={`${sizeConfig.text} drop-shadow-md`}>{config.emoji}</span>
        )}
        
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