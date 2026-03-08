import { useState } from "react";
import { motion } from "framer-motion";
import penguinScarf from "@/assets/penguin-scarf.png";

interface AnimatedPenguinProps {
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
  size = "lg",
  className = "",
}: AnimatedPenguinProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? [1, 1.08, 1] : [1, 1.03, 1],
        y: isHovered ? [0, -10, 0] : 0,
      }}
      transition={{
        duration: isHovered ? 0.4 : 3,
        repeat: isHovered ? 0 : Infinity,
        ease: isHovered ? [0.2, 0.8, 0.2, 1] : "easeInOut",
      }}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent rounded-full blur-xl opacity-50" />
      
      <motion.img
        src={penguinScarf}
        alt="Pingouin"
        className={`${SIZE_MAP[size]} object-contain drop-shadow-lg relative z-10`}
        whileTap={{ scale: 0.95 }}
      />
    </motion.div>
  );
};
