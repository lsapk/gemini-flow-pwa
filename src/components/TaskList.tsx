import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, AlertCircle, CheckSquare, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import SubtaskList from "./SubtaskList";

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  due_date?: string;
  created_at?: string;
};

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  subtasks?: { [taskId: string]: any[] };
  onRefreshSubtasks?: () => void;
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
  subtasks = {},
  onRefreshSubtasks = () => {}
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer votre première tâche !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
      {tasks.map(task => {
        const taskSubtasks = subtasks[task.id] || [];
        const isExpanded = expandedTasks.has(task.id);
        
        return (
          <Card 
            key={task.id}
            className={`
              flex flex-col justify-between
              hover:shadow-md transition-shadow
              border
              ${task.completed ? "bg-muted/60 opacity-80" : ""}
            `}
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""} text-base`}>
                        {task.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(task.id)}
                        className="h-5 w-5 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground break-words">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(task)}
                    aria-label="Modifier"
                    className="h-7 w-7"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    aria-label="Supprimer"
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1`}>
                  {getPriorityIcon(task.priority)} {task.priority}
                </Badge>
                {task.due_date && (
                  <Badge variant="outline">
                    Échéance : {format(new Date(task.due_date), "dd MMM yyyy", { locale: fr })}
                  </Badge>
                )}
                {task.created_at && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    création : {format(new Date(task.created_at), "dd MMM", { locale: fr })}
                  </span>
                )}
              </div>

              {isExpanded && (
                <SubtaskList
                  taskId={task.id}
                  subtasks={taskSubtasks}
                  onRefresh={onRefreshSubtasks}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
