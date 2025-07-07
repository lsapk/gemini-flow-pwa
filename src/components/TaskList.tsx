
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Clock, Target, Trash2, RotateCcw, Plus } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { Task } from "@/types/index";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  showCompleted?: boolean;
  showArchived?: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high': return 'Haute';
    case 'medium': return 'Moyenne';
    case 'low': return 'Basse';
    default: return priority;
  }
};

const getDateInfo = (dueDate: string | null) => {
  if (!dueDate) return null;
  
  const date = new Date(dueDate);
  const now = new Date();
  
  if (isToday(date)) {
    return { text: "Aujourd'hui", color: "text-orange-600 dark:text-orange-400", urgent: true };
  } else if (isTomorrow(date)) {
    return { text: "Demain", color: "text-blue-600 dark:text-blue-400", urgent: false };
  } else if (isPast(date)) {
    return { text: "En retard", color: "text-red-600 dark:text-red-400", urgent: true };
  } else {
    return { 
      text: format(date, "dd MMM", { locale: fr }), 
      color: "text-muted-foreground", 
      urgent: false 
    };
  }
};

export default function TaskList({ 
  tasks, 
  onToggle, 
  onDelete, 
  onRestore, 
  showCompleted = false, 
  showArchived = false 
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">
          {showArchived ? 'Aucune tâche archivée' : showCompleted ? 'Aucune tâche terminée' : 'Aucune tâche'}
        </p>
        <p className="text-sm">
          {!showCompleted && !showArchived && 'Créez votre première tâche pour commencer !'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const dateInfo = getDateInfo(task.due_date);
        const isExpanded = expandedTasks.has(task.id);
        const subtasksCount = task.subtasks?.length || 0;
        
        return (
          <Card key={task.id} className="transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                {!showArchived && (
                  <Button
                    onClick={() => onToggle(task.id)}
                    variant="ghost"
                    size="sm"
                    className={`
                      h-6 w-6 md:h-8 md:w-8 rounded-full p-0 shrink-0 mt-1
                      ${task.completed 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'border-2 border-green-500 hover:bg-green-50 dark:hover:bg-green-950 text-green-500'
                      }
                    `}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                    ) : (
                      <Circle className="h-3 w-3 md:h-4 md:w-4" />
                    )}
                  </Button>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 mb-2">
                    <h3 className={`font-semibold text-base md:text-lg leading-tight ${
                      task.completed ? 'line-through text-muted-foreground' : 
                      showArchived ? 'text-muted-foreground' : ''
                    }`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 sm:gap-2 sm:ml-auto">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      {dateInfo && (
                        <Badge 
                          variant={dateInfo.urgent ? "destructive" : "outline"} 
                          className="text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {dateInfo.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm md:text-base text-muted-foreground mb-3 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(task.id)}
                        className="h-6 px-2 text-xs mb-2"
                      >
                        {isExpanded ? (
                          <><span className="mr-1">▼</span></>
                        ) : (
                          <><span className="mr-1">▶</span></>
                        )}
                        Sous-tâches ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                      </Button>
                      
                      {isExpanded && (
                        <div className="space-y-1 ml-4">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2 text-sm">
                              <div className={`h-2 w-2 rounded-full ${
                                subtask.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`} />
                              <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.created_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Créée le {format(new Date(task.created_at), "dd MMM", { locale: fr })}
                          </span>
                        </div>
                      )}
                      {task.updated_at && task.completed && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>
                            Terminée le {format(new Date(task.updated_at), "dd MMM", { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {showArchived ? (
                    <Button
                      onClick={() => onRestore(task.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onDelete(task.id)}
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
