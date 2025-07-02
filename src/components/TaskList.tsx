
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, AlertCircle, CheckSquare, Clock, Plus, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useState } from "react";
import { Task } from "@/types";
import SubtaskItem from "./SubtaskItem";

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onCreateSubtask?: (parentId: string) => void;
  onDragStart?: (e: React.DragEvent, id: string, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
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
  onCreateSubtask,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
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
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <Card 
          key={task.id}
          className={`transition-shadow hover:shadow-md ${task.completed ? "bg-muted/60 opacity-80" : ""}`}
          draggable={!task.parent_task_id && onDragStart ? true : false}
          onDragStart={onDragStart && !task.parent_task_id ? (e) => onDragStart(e, task.id, index) : undefined}
          onDragOver={onDragOver}
          onDrop={onDrop ? (e) => onDrop(e, index) : undefined}
          onDragEnd={onDragEnd}
          style={{ touchAction: 'none' }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Drag handle - only for main tasks */}
              {!task.parent_task_id && onDragStart && (
                <div className="cursor-grab active:cursor-grabbing touch-none">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id, task.completed)}
                className="flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold text-base ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </h3>
                  
                  {/* Expand/collapse button for tasks with subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && !task.parent_task_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(task.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2 break-words">
                    {task.description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`${getPriorityColor(task.priority || 'low')} flex items-center gap-1`}>
                    {getPriorityIcon(task.priority || 'low')} 
                    {task.priority === 'high' ? 'Élevée' : task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                  </Badge>
                  
                  {task.due_date && (
                    <Badge variant="outline">
                      Échéance : {format(new Date(task.due_date), "dd MMM yyyy", { locale: fr })}
                    </Badge>
                  )}
                  
                  {task.subtasks && task.subtasks.length > 0 && (
                    <Badge variant="secondary">
                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} sous-tâches
                    </Badge>
                  )}
                  
                  {task.created_at && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Créé : {format(new Date(task.created_at), "dd MMM", { locale: fr })}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Add subtask button - only for main tasks */}
                {!task.parent_task_id && onCreateSubtask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateSubtask(task.id)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    title="Ajouter une sous-tâche"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && expandedTasks.has(task.id) && (
              <div className="mt-3 space-y-2">
                {task.subtasks.map(subtask => (
                  <SubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
