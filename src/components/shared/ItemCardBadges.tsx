import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Clock, 
  CheckSquare, 
  Calendar,
  Flame,
  Target
} from 'lucide-react';
import { format, differenceInDays, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Priority Badge
interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low' | string;
  compact?: boolean;
}

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  const config = {
    high: {
      icon: AlertCircle,
      label: 'Haute',
      className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    },
    medium: {
      icon: Clock,
      label: 'Moyenne',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
    },
    low: {
      icon: CheckSquare,
      label: 'Basse',
      className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    },
  };

  const { icon: Icon, label, className } = config[priority as keyof typeof config] || config.low;

  return (
    <Badge variant="outline" className={cn('gap-1 text-xs font-medium', className)}>
      <Icon className="h-3 w-3" />
      {!compact && <span>{label}</span>}
    </Badge>
  );
}

// Due Date Badge with smart labels
interface DueDateBadgeProps {
  dueDate: string;
  compact?: boolean;
}

export function DueDateBadge({ dueDate, compact = false }: DueDateBadgeProps) {
  const date = new Date(dueDate);
  const daysUntil = differenceInDays(date, new Date());
  
  let label: string;
  let className: string;

  if (isPast(date) && !isToday(date)) {
    label = 'En retard';
    className = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400';
  } else if (isToday(date)) {
    label = "Aujourd'hui";
    className = 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400';
  } else if (isTomorrow(date)) {
    label = 'Demain';
    className = 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400';
  } else if (daysUntil <= 7) {
    label = `J-${daysUntil}`;
    className = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400';
  } else {
    label = format(date, 'dd MMM', { locale: fr });
    className = 'bg-muted text-muted-foreground border-border';
  }

  return (
    <Badge variant="outline" className={cn('gap-1 text-xs font-medium', className)}>
      <Calendar className="h-3 w-3" />
      {!compact && <span>{label}</span>}
    </Badge>
  );
}

// Streak Badge with flame animation
interface StreakBadgeProps {
  streak: number;
  compact?: boolean;
}

export function StreakBadge({ streak, compact = false }: StreakBadgeProps) {
  if (streak <= 0) return null;

  const isHotStreak = streak >= 7;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 text-xs font-semibold',
        isHotStreak 
          ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400' 
          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400'
      )}
    >
      <Flame className={cn('h-3 w-3', isHotStreak && 'animate-pulse text-orange-500')} />
      {!compact && <span>{streak}</span>}
    </Badge>
  );
}

// Frequency Badge
interface FrequencyBadgeProps {
  frequency: 'daily' | 'weekly' | 'monthly' | string;
}

export function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  const config = {
    daily: { label: 'Quotidien', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    weekly: { label: 'Hebdo', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    monthly: { label: 'Mensuel', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  };

  const { label, className } = config[frequency as keyof typeof config] || config.daily;

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', className)}>
      {label}
    </Badge>
  );
}

// Category Badge
interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs font-medium bg-muted/50">
      <Target className="h-3 w-3 mr-1" />
      {category}
    </Badge>
  );
}

// Subtask Progress Badge
interface SubtaskBadgeProps {
  completed: number;
  total: number;
}

export function SubtaskBadge({ completed, total }: SubtaskBadgeProps) {
  if (total === 0) return null;
  
  const percentage = Math.round((completed / total) * 100);
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{completed}/{total}</span>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
