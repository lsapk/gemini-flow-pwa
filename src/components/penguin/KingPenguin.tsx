import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import penguinKing from "@/assets/penguin-king.png";

interface KingPenguinProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCrown?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'w-20 h-20', crown: 'w-4 h-4' },
  md: { container: 'w-28 h-28', crown: 'w-5 h-5' },
  lg: { container: 'w-36 h-36', crown: 'w-6 h-6' },
  xl: { container: 'w-48 h-48', crown: 'w-8 h-8' },
};

export const KingPenguin = ({ 
  size = 'md', 
  showCrown = true, 
  animated = true,
  className = ""
}: KingPenguinProps) => {
  const sizeConfig = SIZE_MAP[size];

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      animate={animated ? { y: [0, -6, 0] } : undefined}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-amber-400/5 to-transparent rounded-full blur-2xl scale-150" />
      
      {/* Main image */}
      <motion.img
        src={penguinKing}
        alt="Roi Pingouin"
        className={`${sizeConfig.container} object-contain drop-shadow-2xl relative z-10 cursor-pointer`}
        whileHover={{ 
          scale: 1.1,
          y: -10,
          rotate: [0, -3, 3, 0],
          transition: { 
            scale: { type: "spring", stiffness: 400 },
            rotate: { duration: 0.4 }
          }
        }}
        whileTap={{ scale: 0.95 }}
      />

      {/* Crown sparkle effect */}
      {showCrown && (
        <motion.div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-20"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className={`${sizeConfig.crown} text-amber-400 drop-shadow-lg`} />
        </motion.div>
      )}

      {/* Breathing ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-amber-400/20"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
};
