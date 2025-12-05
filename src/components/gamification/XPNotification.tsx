import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Star } from "lucide-react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface XPNotification {
  id: string;
  xp: number;
  message?: string;
  type: "xp" | "level" | "credits";
}

interface XPNotificationContextType {
  showXP: (xp: number, message?: string) => void;
  showLevelUp: (level: number) => void;
  showCredits: (credits: number) => void;
}

const XPNotificationContext = createContext<XPNotificationContextType | null>(null);

export const useXPNotification = () => {
  const context = useContext(XPNotificationContext);
  if (!context) {
    // Return no-op functions if context is not available
    return {
      showXP: () => {},
      showLevelUp: () => {},
      showCredits: () => {},
    };
  }
  return context;
};

export const XPNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<XPNotification[]>([]);

  const addNotification = useCallback((notification: Omit<XPNotification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2500);
  }, []);

  const showXP = useCallback((xp: number, message?: string) => {
    addNotification({ xp, message, type: "xp" });
  }, [addNotification]);

  const showLevelUp = useCallback((level: number) => {
    addNotification({ xp: level, message: `Niveau ${level} atteint !`, type: "level" });
  }, [addNotification]);

  const showCredits = useCallback((credits: number) => {
    addNotification({ xp: credits, message: "Crédits gagnés", type: "credits" });
  }, [addNotification]);

  return (
    <XPNotificationContext.Provider value={{ showXP, showLevelUp, showCredits }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg ${
                notification.type === "level"
                  ? "bg-gradient-to-r from-warning/90 to-warning/70 text-white"
                  : notification.type === "credits"
                  ? "bg-gradient-to-r from-success/90 to-success/70 text-white"
                  : "bg-gradient-to-r from-primary/90 to-primary/70 text-white"
              }`}
            >
              {notification.type === "level" ? (
                <TrendingUp className="h-5 w-5" />
              ) : notification.type === "credits" ? (
                <Star className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              <span className="font-bold">
                {notification.type === "level" 
                  ? notification.message 
                  : notification.type === "credits"
                  ? `+${notification.xp} 💰`
                  : `+${notification.xp} XP`}
              </span>
              {notification.message && notification.type === "xp" && (
                <span className="text-sm opacity-90">{notification.message}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </XPNotificationContext.Provider>
  );
};
