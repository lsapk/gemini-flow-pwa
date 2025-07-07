
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Target, Trash2, RotateCcw } from "lucide-react";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Habit } from "@/types/index";

interface HabitListProps {
  habits: Habit[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  showArchived?: boolean;
}

const getFrequencyText = (frequency: string) => {
  switch (frequency) {
    case 'daily': return 'Quotidien';
    case 'weekly': return 'Hebdomadaire';
    case 'monthly': return 'Mensuel';
    default: return frequency;
  }
};

const getCategoryColor = (category: string | null) => {
  switch (category) {
    case 'health': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'productivity': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'personal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'learning': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export default function HabitList({ 
  habits, 
  onToggle, 
  onDelete, 
  onRestore, 
  showArchived = false 
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">
          {showArchived ? 'Aucune habitude archivée' : 'Aucune habitude'}
        </p>
        <p className="text-sm">
          {!showArchived && 'Créez votre première habitude pour commencer !'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => {
        const wasCompletedToday = habit.last_completed_at && isToday(new Date(habit.last_completed_at));
        
        return (
          <Card key={habit.id} className="transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                {!showArchived && (
                  <Button
                    onClick={() => onToggle(habit.id)}
                    variant="ghost"
                    size="sm"
                    className={`
                      h-10 w-10 md:h-12 md:w-12 rounded-full p-0 shrink-0 border-4
                      ${wasCompletedToday 
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                        : 'border-green-500 hover:bg-green-50 dark:hover:bg-green-950 text-green-500 bg-white dark:bg-transparent'
                      }
                    `}
                  >
                    {wasCompletedToday ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <Circle className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                  </Button>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                    <h3 className={`font-semibold text-base md:text-lg truncate ${showArchived ? 'text-muted-foreground' : ''}`}>
                      {habit.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getFrequencyText(habit.frequency)}
                      </Badge>
                      {habit.category && (
                        <Badge className={`text-xs ${getCategoryColor(habit.category)}`}>
                          {habit.category}
                        </Badge>
                      )}
                      {habit.streak && habit.streak > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          🔥 {habit.streak} jour{habit.streak > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {habit.description && (
                    <p className="text-sm md:text-base text-muted-foreground mb-2 line-clamp-2">
                      {habit.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Objectif: {habit.target}</span>
                    </div>
                    {habit.last_completed_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Dernière: {format(new Date(habit.last_completed_at), "dd MMM", { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {showArchived ? (
                    <Button
                      onClick={() => onRestore(habit.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onDelete(habit.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
