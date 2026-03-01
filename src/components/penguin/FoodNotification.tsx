import React, { useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FoodType } from "@/hooks/usePenguinRewards";

interface Notification {
  id: string;
  type: 'food' | 'evolution';
  foodType?: FoodType;
  message: string;
}

interface FoodNotificationContextType {
  showFood: (foodType: FoodType, message: string) => void;
  showEvolution: (stageName: string) => void;
}

const FoodNotificationContext = createContext<FoodNotificationContextType | null>(null);

export const useFoodNotification = () => {
  const context = useContext(FoodNotificationContext);
  if (!context) {
    return {
      showFood: () => {},
      showEvolution: () => {},
    };
  }
  return context;
};

const FOOD_COLORS: Record<string, string> = {
  shrimp: 'from-orange-400/20 to-orange-500/10 border-orange-400/30',
  salmon: 'from-rose-400/20 to-rose-500/10 border-rose-400/30',
  golden_fish: 'from-amber-400/20 to-amber-500/10 border-amber-400/30',
};

const FOOD_EMOJIS: Record<string, string> = {
  shrimp: '🦐',
  salmon: '🐟',
  golden_fish: '✨🐠',
};

export const FoodNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((n: Notification) => {
    setNotifications(prev => [...prev, n]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== n.id));
    }, 3000);
  }, []);

  const showFood = useCallback((foodType: FoodType, message: string) => {
    addNotification({ id: crypto.randomUUID(), type: 'food', foodType, message });
  }, [addNotification]);

  const showEvolution = useCallback((stageName: string) => {
    addNotification({ id: crypto.randomUUID(), type: 'evolution', message: `🐧 Évolution : ${stageName} !` });
  }, [addNotification]);

  return (
    <FoodNotificationContext.Provider value={{ showFood, showEvolution }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 80, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.8 }}
              className={`px-4 py-3 rounded-2xl border backdrop-blur-md bg-gradient-to-r shadow-lg ${
                n.type === 'evolution'
                  ? 'from-sky-400/20 to-indigo-500/10 border-sky-400/30'
                  : FOOD_COLORS[n.foodType || 'shrimp']
              }`}
            >
              <div className="flex items-center gap-2">
                {n.type === 'food' && (
                  <span className="text-xl">{FOOD_EMOJIS[n.foodType || 'shrimp']}</span>
                )}
                {n.type === 'evolution' && (
                  <span className="text-xl">🐧</span>
                )}
                <span className="text-sm font-medium text-foreground">{n.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FoodNotificationContext.Provider>
  );
};
