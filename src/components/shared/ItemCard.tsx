import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle } from './CheckCircle';
import { ProgressRing } from './ProgressRing';
import { DragHandle } from './DragHandle';
import { ItemCardActions } from './ItemCardActions';
import {
  PriorityBadge,
  DueDateBadge,
  StreakBadge,
  FrequencyBadge,
  CategoryBadge,
  SubtaskBadge,
} from './ItemCardBadges';

export type ItemType = 'task' | 'habit' | 'goal';
export type ItemVariant = 'compact' | 'standard' | 'expanded';

interface BaseItemData {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

interface TaskData extends BaseItemData {
  priority?: 'high' | 'medium' | 'low';
  due_date?: string;
  created_at?: string;
}

interface HabitData extends BaseItemData {
  frequency: 'daily' | 'weekly' | 'monthly';
  streak?: number;
  is_completed_today?: boolean;
  category?: string;
  target?: number;
  days_of_week?: number[];
}

interface GoalData extends BaseItemData {
  progress: number;
  category?: string;
  target_date?: string;
}

type ItemData = TaskData | HabitData | GoalData;

interface ItemCardProps {
  type: ItemType;
  data: ItemData;
  variant?: ItemVariant;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isArchived?: boolean;
  isDragging?: boolean;
  dragHandleProps?: {
    listeners: any;
    attributes: any;
  };
  children?: React.ReactNode;
  subtaskCount?: number;
  subtaskCompleted?: number;
  className?: string;
}

const priorityBorderColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

export function ItemCard({
  type,
  data,
  variant = 'standard',
  onComplete,
  onEdit,
  onDelete,
  onArchive,
  isArchived = false,
  isDragging = false,
  dragHandleProps,
  children,
  subtaskCount = 0,
  subtaskCompleted = 0,
  className,
}: ItemCardProps) {
  const isCompleted = type === 'habit' 
    ? (data as HabitData).is_completed_today 
    : data.completed;

  const taskData = type === 'task' ? (data as TaskData) : null;
  const habitData = type === 'habit' ? (data as HabitData) : null;
  const goalData = type === 'goal' ? (data as GoalData) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isDragging ? 0.7 : 1, 
        y: 0,
        scale: isDragging ? 1.02 : 1,
        rotate: isDragging ? 1 : 0,
      }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group',
        isDragging && 'z-50',
        className
      )}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'hover:shadow-md',
          'border-l-4',
          // Priority-based border for tasks
          taskData?.priority 
            ? priorityBorderColors[taskData.priority] 
            : 'border-l-transparent',
          // Completed state
          isCompleted && 'bg-muted/40 opacity-80',
          // Archived state
          isArchived && 'opacity-60',
          // Dragging state
          isDragging && 'shadow-lg ring-2 ring-primary/20'
        )}
      >
        <CardContent className={cn(
          'p-3 sm:p-4',
          variant === 'compact' && 'p-2 sm:p-3'
        )}>
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Drag Handle */}
            {dragHandleProps && (
              <DragHandle 
                listeners={dragHandleProps.listeners} 
                attributes={dragHandleProps.attributes}
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            )}

            {/* Checkbox / Progress Ring */}
            <div className="flex-shrink-0 mt-0.5">
              {type === 'goal' ? (
                <ProgressRing 
                  progress={goalData?.progress || 0} 
                  size="md"
                />
              ) : (
                <CheckCircle
                  checked={!!isCompleted}
                  onChange={() => onComplete?.()}
                  size="lg"
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    'font-semibold text-sm sm:text-base leading-tight',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {data.title}
                </h3>
                
                {/* Actions - visible on hover */}
                <ItemCardActions
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  isArchived={isArchived}
                  showInline
                />
              </div>

              {/* Description (for standard/expanded) */}
              {variant !== 'compact' && data.description && (
                <p className={cn(
                  'text-xs sm:text-sm text-muted-foreground line-clamp-2',
                  isCompleted && 'line-through'
                )}>
                  {data.description}
                </p>
              )}

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Task-specific badges */}
                {taskData && (
                  <>
                    {taskData.priority && (
                      <PriorityBadge priority={taskData.priority} />
                    )}
                    {taskData.due_date && (
                      <DueDateBadge dueDate={taskData.due_date} />
                    )}
                  </>
                )}

                {/* Habit-specific badges */}
                {habitData && (
                  <>
                    <FrequencyBadge frequency={habitData.frequency} />
                    {habitData.streak && habitData.streak > 0 && (
                      <StreakBadge streak={habitData.streak} />
                    )}
                    {habitData.category && (
                      <CategoryBadge category={habitData.category} />
                    )}
                  </>
                )}

                {/* Goal-specific badges */}
                {goalData && (
                  <>
                    {goalData.category && (
                      <CategoryBadge category={goalData.category} />
                    )}
                    {goalData.target_date && (
                      <DueDateBadge dueDate={goalData.target_date} />
                    )}
                  </>
                )}

                {/* Subtask indicator */}
                {subtaskCount > 0 && (
                  <SubtaskBadge completed={subtaskCompleted} total={subtaskCount} />
                )}
              </div>

              {/* Expandable content (children) - always render if present */}
              {children && (
                <div className={cn("mt-3", variant === 'expanded' && "pt-3 border-t border-border")}>
                  {children}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Re-export for convenience
export { CheckCircle } from './CheckCircle';
export { ProgressRing } from './ProgressRing';
export { DragHandle } from './DragHandle';
export { ItemCardActions, ExpandToggle, AddButton } from './ItemCardActions';
export { FilterBar, type ViewMode } from './FilterBar';
export * from './ItemCardBadges';
