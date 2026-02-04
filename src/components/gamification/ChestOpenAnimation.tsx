import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ChestReward {
  type: "xp" | "credits" | "cosmetic" | "boost";
  value: string | number;
  icon: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface ChestOpenAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  reward: ChestReward | null;
  chestType?: "bronze" | "silver" | "gold";
}

const rarityStyles = {
  common: {
    bg: "from-gray-500 to-gray-600",
    glow: "rgba(156, 163, 175, 0.5)",
    text: "text-gray-300",
  },
  rare: {
    bg: "from-blue-500 to-cyan-500",
    glow: "rgba(59, 130, 246, 0.5)",
    text: "text-blue-400",
  },
  epic: {
    bg: "from-purple-500 to-pink-500",
    glow: "rgba(168, 85, 247, 0.5)",
    text: "text-purple-400",
  },
  legendary: {
    bg: "from-amber-400 to-yellow-500",
    glow: "rgba(251, 191, 36, 0.6)",
    text: "text-amber-400",
  },
};

const chestIcons = {
  bronze: "🎁",
  silver: "📦",
  gold: "🎊",
};

export function ChestOpenAnimation({ isOpen, onClose, reward, chestType = "bronze" }: ChestOpenAnimationProps) {
  const [phase, setPhase] = useState<"closed" | "opening" | "reveal">("closed");

  useEffect(() => {
    if (isOpen && reward) {
      setPhase("closed");
      const timer1 = setTimeout(() => setPhase("opening"), 500);
      const timer2 = setTimeout(() => setPhase("reveal"), 1500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, reward]);

  if (!reward) return null;

  const rarityStyle = rarityStyles[reward.rarity];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-primary/20 overflow-hidden">
        <DialogTitle className="sr-only">Récompense du coffre</DialogTitle>
        
        <div className="relative min-h-[300px] flex flex-col items-center justify-center">
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/50"
                initial={{ 
                  x: "50%", 
                  y: "50%",
                  opacity: 0 
                }}
                animate={phase === "reveal" ? {
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0],
                } : {}}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>

          {/* Chest phases */}
          <AnimatePresence mode="wait">
            {phase === "closed" && (
              <motion.div
                key="closed"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-8xl"
              >
                {chestIcons[chestType]}
              </motion.div>
            )}

            {phase === "opening" && (
              <motion.div
                key="opening"
                initial={{ scale: 1 }}
                animate={{ 
                  scale: [1, 1.1, 1, 1.2, 1],
                  rotate: [-5, 5, -5, 5, 0],
                }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1 }}
                className="text-8xl relative"
              >
                {chestIcons[chestType]}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ 
                    boxShadow: [
                      `0 0 0px ${rarityStyle.glow}`,
                      `0 0 60px ${rarityStyle.glow}`,
                      `0 0 100px ${rarityStyle.glow}`,
                    ]
                  }}
                  transition={{ duration: 1 }}
                />
              </motion.div>
            )}

            {phase === "reveal" && (
              <motion.div
                key="reveal"
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-center"
              >
                {/* Rarity glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${rarityStyle.glow}, transparent 70%)`,
                  }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Reward icon */}
                <motion.div
                  className="text-7xl mb-4 relative z-10"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {reward.icon}
                </motion.div>

                {/* Reward name */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-xl font-heading mb-2 ${rarityStyle.text}`}
                >
                  {reward.name}
                </motion.h3>

                {/* Value */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${rarityStyle.bg} text-white font-heading`}
                >
                  <Sparkles className="w-4 h-4" />
                  {typeof reward.value === "number" ? `+${reward.value}` : reward.value}
                </motion.div>

                {/* Rarity badge */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`mt-3 text-sm uppercase tracking-wider ${rarityStyle.text}`}
                >
                  {reward.rarity}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button */}
          {phase === "reveal" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute bottom-4"
            >
              <Button onClick={onClose} variant="outline" className="border-primary/30">
                Continuer
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
