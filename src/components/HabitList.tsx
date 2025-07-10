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
      <div className="grid gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer votre première habitude !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6">
      {habits.map((habit) => (
        <Card key={habit.id} className={`hover:shadow-md transition-shadow ${showArchived ? 'opacity-75' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={habit.is_completed_today || false}
                    onCheckedChange={() => onComplete(habit.id, habit.is_completed_today || false)}
                    className="w-6 h-6 mt-1 data-[state=checked]:bg-green-500 border-2"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{habit.title}</h3>
                    <Badge className={getFrequencyColor(habit.frequency)}>
                      {getFrequencyLabel(habit.frequency)}
                    </Badge>
                  </div>
                  
                  {habit.description && (
                    <p className="text-muted-foreground mb-3">{habit.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>Objectif: {habit.target}</span>
                    </div>
                    
                    {habit.streak && habit.streak > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-600">🔥</span>
                        <span>Série: {habit.streak} jour{habit.streak > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    
                    {habit.last_completed_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Dernière fois: {format(new Date(habit.last_completed_at), 'dd MMM', { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {onArchive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onArchive(habit.id, showArchived)}
                    aria-label={showArchived ? "Restaurer" : "Archiver"}
                    className="h-8 w-8"
                  >
                    {showArchived ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(habit)}
                  aria-label="Modifier"
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(habit.id)}
                  aria-label="Supprimer"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
