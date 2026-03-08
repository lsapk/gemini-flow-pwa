import { useState } from "react";
import { motion } from "framer-motion";
import penguinKing from "@/assets/penguin-king.png";
import penguinMascot from "@/assets/penguin-mascot.png";

interface AnimatedPenguinProps {
  variant?: "king" | "mascot";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

export const AnimatedPenguin = ({
  variant = "king",
  size = "lg",
  className = "",
}: AnimatedPenguinProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const imageSrc = variant === "king" ? penguinKing : penguinMascot;

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? [1, 1.05, 1] : [1, 1.02, 1],
        y: isHovered ? [0, -8, 0] : 0,
      }}
      transition={{
        duration: isHovered ? 0.4 : 3,
        repeat: isHovered ? 0 : Infinity,
        ease: isHovered ? [0.2, 0.8, 0.2, 1] : "easeInOut",
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-amber-400/10 to-transparent rounded-full blur-xl opacity-60" />
      
      <motion.img
        src={imageSrc}
        alt={variant === "king" ? "Roi Pingouin" : "Pingouin Mascotte"}
        className={`${SIZE_MAP[size]} object-contain drop-shadow-2xl relative z-10`}
        whileTap={{ scale: 0.95 }}
      />

      {/* Crown sparkle for king */}
      {variant === "king" && (
        <motion.span
          className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-400 z-20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.span>
      )}
    </motion.div>
  );
};
