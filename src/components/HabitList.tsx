
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Target, Calendar, Archive, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Habit } from "@/types";

interface HabitListProps {
  habits: Habit[];
  loading?: boolean;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onRefresh: () => void;
  onArchive?: (id: string, isArchived: boolean) => void;
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

export default function HabitList({
  habits,
  loading,
  onEdit,
  onDelete,
  onComplete,
  onRefresh,
  onArchive,
  showArchived = false
}: HabitListProps) {
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

  return (
    <div className="grid gap-2 md:gap-4">
      {habits.map((habit) => (
        <Card key={habit.id} className={`hover:shadow-md transition-shadow ${showArchived ? 'opacity-75' : ''}`}>
           <CardContent className="p-1 sm:p-1.5 md:p-2">
              <div className="flex items-start gap-1 w-full min-w-0">
                <div className="flex items-start gap-1 flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
                     <Checkbox
                       checked={habit.is_completed_today || false}
                       onCheckedChange={() => onComplete(habit.id, habit.is_completed_today || false)}
                       size="xl"
                       className="data-[state=checked]:bg-green-500 border-2 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                     />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5 mb-0.5">
                      <h3 className="font-semibold text-xs truncate leading-tight">{habit.title}</h3>
                      <Badge className={`${getFrequencyColor(habit.frequency)} text-xs flex-shrink-0 w-fit`}>
                        {getFrequencyLabel(habit.frequency)}
                      </Badge>
                    </div>
                    
                    {habit.description && (
                      <p className="text-muted-foreground mb-0.5 text-xs line-clamp-1 break-words">{habit.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <Target className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate text-xs">{habit.target}</span>
                      </div>
                      
                      {habit.streak && habit.streak > 0 && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <span className="text-orange-600 text-xs">🔥</span>
                          <span className="text-xs">{habit.streak}</span>
                        </div>
                      )}
                      
                      {habit.last_completed_at && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="text-xs">{format(new Date(habit.last_completed_at), 'dd/MM', { locale: fr })}</span>
                        </div>
                      )}
                    </div>
                 </div>
               </div>
               
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                 {onArchive && (
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => onArchive(habit.id, showArchived)}
                     aria-label={showArchived ? "Restaurer" : "Archiver"}
                     className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                   >
                     {showArchived ? (
                       <RotateCcw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                     ) : (
                       <Archive className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                     )}
                   </Button>
                 )}
                 
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => onEdit(habit)}
                   aria-label="Modifier"
                   className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                 >
                   <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                 </Button>
                 
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => onDelete(habit.id)}
                   aria-label="Supprimer"
                   className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                 >
                   <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                 </Button>
               </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
