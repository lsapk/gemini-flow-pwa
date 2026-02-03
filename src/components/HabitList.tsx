import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Habit } from "@/types";
import { ItemCard, FilterBar, ViewMode } from "@/components/shared/ItemCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HabitListProps {
  habits: Habit[];
  loading?: boolean;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onRefresh: () => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  onReorder?: (habits: Habit[]) => void;
  showArchived?: boolean;
}

interface SortableHabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  showArchived: boolean;
}

// Days of week indicator component
function DaysIndicator({ daysOfWeek, completedToday }: { daysOfWeek?: number[], completedToday?: boolean }) {
  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const today = new Date().getDay();
  
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 mt-2">
      {days.map((day, index) => {
        const isActive = daysOfWeek.includes(index);
        const isToday = index === today;
        return (
          <div
            key={index}
            className={`
              w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center
              ${isActive 
                ? isToday 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted-foreground/20 text-muted-foreground'
                : 'text-muted-foreground/30'
              }
            `}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}

function SortableHabitCard({ habit, onEdit, onDelete, onComplete, onArchive, showArchived }: SortableHabitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        type="habit"
        data={habit}
        variant="standard"
        onComplete={() => onComplete(habit.id, habit.is_completed_today || false)}
        onEdit={() => onEdit(habit)}
        onDelete={() => onDelete(habit.id)}
        onArchive={onArchive ? () => onArchive(habit.id, showArchived) : undefined}
        isArchived={showArchived}
        isDragging={isDragging}
        dragHandleProps={{ listeners, attributes }}
      >
        {/* Additional habit info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>Objectif: {habit.target}</span>
            </div>
            {habit.last_completed_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Dernier: {format(new Date(habit.last_completed_at), 'dd/MM', { locale: fr })}</span>
              </div>
            )}
          </div>
          <DaysIndicator 
            daysOfWeek={habit.days_of_week} 
            completedToday={habit.is_completed_today}
          />
        </div>
      </ItemCard>
    </div>
  );
}

export default function HabitList({
  habits,
  loading,
  onEdit,
  onDelete,
  onComplete,
  onRefresh,
  onArchive,
  onReorder,
  showArchived = false
}: HabitListProps) {
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      const newHabits = arrayMove(habits, oldIndex, newIndex);
      onReorder?.(newHabits);
    }
  };

  // Filter habits
  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      habit.description?.toLowerCase().includes(searchValue.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune habitude</h3>
          <p className="text-muted-foreground">
            Commencez par créer votre première habitude !
          </p>
        </CardContent>
      </Card>
    );
  }

  const allCompleted = habits.length > 0 && habits.every(habit => habit.is_completed_today);

  return (
    <div className="space-y-4">
      {/* Celebration banner */}
      <AnimatePresence>
        {allCompleted && !showArchived && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🎉</span>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Félicitations !
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Vous avez complété toutes vos habitudes du jour !
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showPriorityFilter={false}
        showViewToggle={false}
      />
        
      {/* Habits List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredHabits.map(h => h.id)} strategy={verticalListSortingStrategy}>
          <motion.div layout className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit) => (
                <SortableHabitCard
                  key={habit.id}
                  habit={habit}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onComplete={onComplete}
                  onArchive={onArchive}
                  showArchived={showArchived}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>
      </DndContext>

      {/* Empty filtered state */}
      {filteredHabits.length === 0 && habits.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucune habitude ne correspond à votre recherche.
            </p>
            <Button 
              variant="link" 
              onClick={() => setSearchValue('')}
            >
              Réinitialiser la recherche
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
