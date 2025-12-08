import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Target, Calendar, Archive, RotateCcw, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Habit } from "@/types";
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

const getFrequencyLabel = (frequency: string) => {
  switch (frequency) {
    case 'daily': return 'Quotidien';
    case 'weekly': return 'Hebdomadaire';
    case 'monthly': return 'Mensuel';
    default: return frequency;
  }
};

const getFrequencyColor = (frequency: string) => {
  switch (frequency) {
    case 'daily': return 'bg-green-100 text-green-800 border-green-200';
    case 'weekly': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface SortableHabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  showArchived: boolean;
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`hover:shadow-md transition-shadow overflow-hidden ${showArchived ? 'opacity-75' : ''}`}>
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex items-start gap-2 w-full overflow-hidden">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <Checkbox
              checked={habit.is_completed_today || false}
              onCheckedChange={() => onComplete(habit.id, habit.is_completed_today || false)}
              size="large"
              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 mt-0.5 flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight truncate">{habit.title}</h3>
                  <Badge className={`${getFrequencyColor(habit.frequency)} text-[10px] mt-1 px-1.5 py-0`}>
                    {getFrequencyLabel(habit.frequency)}
                  </Badge>
                </div>
                
                <div className="flex gap-1 flex-shrink-0">
                  {onArchive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(habit.id, showArchived)}
                      aria-label={showArchived ? "Restaurer" : "Archiver"}
                      className="h-7 w-7 p-0"
                    >
                      {showArchived ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(habit)}
                    aria-label="Modifier"
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(habit.id)}
                    aria-label="Supprimer"
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              {habit.description && (
                <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">{habit.description}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{habit.target}</span>
                </div>
                
                {habit.days_of_week && habit.days_of_week.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {habit.days_of_week.map(day => 
                        ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day]
                      ).join(', ')}
                    </span>
                  </div>
                )}
                
                {habit.streak && habit.streak > 0 && (
                  <div className="flex items-center gap-1">
                    <span>🔥</span>
                    <span>{habit.streak}</span>
                  </div>
                )}
                
                {habit.last_completed_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{format(new Date(habit.last_completed_at), 'dd/MM', { locale: fr })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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

  if (loading) {
    return (
      <div className="grid gap-2 md:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3 md:p-6">
              <div className="h-4 sm:h-5 md:h-6 bg-muted rounded mb-2 md:mb-4"></div>
              <div className="h-3 md:h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6 md:py-8">
          <Target className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <h3 className="text-sm md:text-lg font-medium mb-2">Aucune habitude</h3>
          <p className="text-xs md:text-base text-muted-foreground mb-3 md:mb-4">
            Commencez par créer votre première habitude !
          </p>
        </CardContent>
      </Card>
    );
  }

  const allCompleted = habits.length > 0 && habits.every(habit => habit.is_completed_today);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-2 md:gap-4">
        {allCompleted && !showArchived && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl md:text-4xl">🎉</span>
                <h3 className="text-sm md:text-lg font-semibold text-green-800 dark:text-green-200">
                  Félicitations !
                </h3>
                <p className="text-xs md:text-sm text-green-700 dark:text-green-300">
                  Vous avez complété toutes vos habitudes du jour !
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
          {habits.map((habit) => (
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
        </SortableContext>
      </div>
    </DndContext>
  );
}
