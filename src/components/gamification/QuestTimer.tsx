import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestTimerProps {
  expiresAt: string;
  className?: string;
}

export function QuestTimer({ expiresAt, className }: QuestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isUrgent: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, isUrgent: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const isUrgent = hours < 2; // Less than 2 hours

      return { hours, minutes, seconds, isExpired: false, isUrgent };
    };

    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-destructive", className)}>
        <AlertTriangle className="w-3 h-3" />
        <span>Expirée</span>
      </div>
    );
  }

  const formatTime = (n: number) => n.toString().padStart(2, '0');

  return (
    <motion.div 
      className={cn(
        "flex items-center gap-1.5 text-xs font-mono rounded-lg px-2 py-1",
        timeLeft.isUrgent 
          ? "bg-destructive/20 text-destructive border border-destructive/30" 
          : "bg-muted/50 text-muted-foreground",
        className
      )}
      animate={timeLeft.isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <Clock className="w-3 h-3" />
      <span>
        {timeLeft.hours > 0 && `${formatTime(timeLeft.hours)}:`}
        {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
    </motion.div>
  );
}
