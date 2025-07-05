
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Archive, ArchiveRestore, Flame, Target, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Habit } from "@/types";
import DraggableHabitList from "./DraggableHabitList";

interface HabitListProps {
  habits: Habit[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onRefresh: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  showArchived: boolean;
}

const getFrequencyColor = (frequency: string) => {
  switch (frequency) {
    case 'daily': return 'bg-green-100 text-green-800 border-green-200';
    case 'weekly': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getFrequencyLabel = (frequency: string) => {
  switch (frequency) {
    case 'daily': return 'Quotidien';
    case 'weekly': return 'Hebdomadaire';
    case 'monthly': return 'Mensuel';
    default: return frequency;
  }
};

export default function HabitList({
  habits,
  loading,
  onDelete,
  onEdit,
  onComplete,
  onRefresh,
  onArchive,
  onUnarchive,
  showArchived
}: HabitListProps) {
  const activeHabits = habits.filter(h => !h.is_archived);
  const completedToday = activeHabits.filter(h => h.is_completed_today).length;
  const avgStreak = activeHabits.length > 0 ? 
    activeHabits.reduce((sum, h) => sum + (h.streak || 0), 0) / activeHabits.length : 0;

  const renderHabit = (habit: Habit) => (
    <Card className={`hover:shadow-sm transition-shadow border ${habit.is_completed_today ? "bg-green-50 border-green-200" : ""}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                <h3 className={`font-medium ${habit.is_completed_today ? "line-through text-muted-foreground" : ""} text-sm sm:text-base break-words`}>
                  {habit.title}
                </h3>
                {habit.is_completed_today && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    ✓ Fait
                  </Badge>
                )}
                {habit.is_archived && (
                  <Badge variant="secondary" className="text-xs">
                    Archivée
                  </Badge>
                )}
              </div>
              
              {habit.description && (
                <p className="text-xs text-muted-foreground mb-2 break-words">
                  {habit.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                <Badge className={`${getFrequencyColor(habit.frequency)} text-xs`}>
                  {getFrequencyLabel(habit.frequency)}
                </Badge>
                {habit.category && (
                  <Badge variant="outline" className="text-xs">
                    {habit.category}
                  </Badge>
                )}
                {habit.streak && habit.streak > 0 && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    <Flame className="h-3 w-3 mr-1" />
                    {habit.streak} jour{habit.streak > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {habit.last_completed_at && (
                <p className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">
                    Dernière fois: {format(new Date(habit.last_completed_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </span>
                  <span className="sm:hidden">
                    {format(new Date(habit.last_completed_at), "dd/MM HH:mm", { locale: fr })}
                  </span>
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
            {/* Bouton rond pour cocher/décocher l'habitude */}
            <button
              onClick={() => onComplete(habit.id, habit.is_completed_today || false)}
              disabled={habit.is_archived}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                habit.is_completed_today
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400 bg-white hover:bg-green-50'
              } ${habit.is_archived ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {habit.is_completed_today && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(habit)}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => habit.is_archived ? onUnarchive(habit.id) : onArchive(habit.id)}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              {habit.is_archived ? (
                <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(habit.id)}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cartes résumé - optimisées pour mobile */}
      {!showArchived && (
        <div className="grid gap-2 sm:gap-4 grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Faites aujourd'hui</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4">
              <div className="text-lg sm:text-2xl font-bold">{completedToday}</div>
              <p className="text-xs text-muted-foreground">
                / {activeHabits.length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Série moy.</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4">
              <div className="text-lg sm:text-2xl font-bold">{Math.round(avgStreak)}</div>
              <p className="text-xs text-muted-foreground">
                jour{Math.round(avgStreak) > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des habitudes */}
      <DraggableHabitList
        habits={habits}
        loading={loading}
        onDelete={onDelete}
        onEdit={onEdit}
        onComplete={onComplete}
        onRefresh={onRefresh}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        showArchived={showArchived}
        renderHabit={renderHabit}
      />
    </div>
  );
}
