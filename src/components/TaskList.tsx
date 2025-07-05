
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, AlertCircle, CheckSquare, Clock, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useState } from "react";
import DraggableList from "./DraggableList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  due_date?: string;
  created_at?: string;
  parent_task_id?: string;
  subtasks_count?: number;
  sort_order?: number;
};

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onRefresh?: () => void;
  onCreateSubTask: (parentTaskId: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return <AlertCircle className="h-3 w-3" />;
    case 'medium': return <Clock className="h-3 w-3" />;
    case 'low': return <CheckSquare className="h-3 w-3" />;
    default: return null;
  }
};

export default function TaskList({
  tasks,
  loading,
  onEdit,
  onDelete,
  onToggleComplete,
  onRefresh,
  onCreateSubTask,
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const updateTaskOrder = async (reorderedTasks: Task[]) => {
    if (!user) return;

    try {
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      if (onRefresh) onRefresh();
      toast.success('Ordre des tâches mis à jour');
    } catch (error) {
      console.error('Error updating task order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 sm:h-4 bg-muted rounded w-2/3" />
                  <div className="h-2 sm:h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Séparer les tâches principales des sous-tâches
  const mainTasks = tasks.filter(task => !task.parent_task_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const subTasksMap = tasks.reduce((acc, task) => {
    if (task.parent_task_id) {
      if (!acc[task.parent_task_id]) {
        acc[task.parent_task_id] = [];
      }
      acc[task.parent_task_id].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  if (mainTasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6 sm:py-8 px-3 sm:px-4">
          <CheckSquare className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">Aucune tâche</h3>
          <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
            Commencez par créer votre première tâche !
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderTask = (task: Task, isSubTask = false) => {
    const subTasks = subTasksMap[task.id] || [];
    const subtasksCount = subTasks.length;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <div key={task.id}>
        <Card 
          className={`
            ${isSubTask ? 'ml-4 sm:ml-6 border-l-2 border-l-blue-200' : ''}
            hover:shadow-sm transition-shadow
            border
            ${task.completed ? "bg-muted/50 opacity-75" : ""}
          `}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id, task.completed)}
                  className="mt-0.5 sm:mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                    <h3 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""} text-sm sm:text-base break-words`}>
                      {task.title}
                    </h3>
                    {!isSubTask && subtasksCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(task.id)}
                        className="h-5 sm:h-6 px-1 sm:px-2 text-xs flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1" />
                        )}
                        <span className="hidden sm:inline">
                          {subtasksCount} sous-tâche{subtasksCount > 1 ? 's' : ''}
                        </span>
                        <span className="sm:hidden">
                          {subtasksCount}
                        </span>
                      </Button>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-2 break-words">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                    <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1 text-xs`}>
                      {getPriorityIcon(task.priority)} 
                      <span className="hidden sm:inline">{task.priority}</span>
                      <span className="sm:hidden">{task.priority[0].toUpperCase()}</span>
                    </Badge>
                    {task.due_date && (
                      <Badge variant="outline" className="text-xs">
                        <span className="hidden sm:inline">
                          {format(new Date(task.due_date), "dd MMM yyyy", { locale: fr })}
                        </span>
                        <span className="sm:hidden">
                          {format(new Date(task.due_date), "dd/MM", { locale: fr })}
                        </span>
                      </Badge>
                    )}
                    {task.created_at && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {format(new Date(task.created_at), "dd MMM", { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-0.5 sm:gap-1 ml-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                {!isSubTask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateSubTask(task.id)}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task.id)}
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isExpanded && subTasks.length > 0 && (
          <div className="mt-2 space-y-2">
            {subTasks.map(subTask => renderTask(subTask, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DraggableList
      items={mainTasks}
      onReorder={updateTaskOrder}
      renderItem={(task) => renderTask(task)}
      getItemId={(task) => task.id}
    />
  );
}
