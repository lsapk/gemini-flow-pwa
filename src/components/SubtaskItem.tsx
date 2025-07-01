
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit } from "lucide-react";
import { Task } from "@/types";

interface SubtaskItemProps {
  subtask: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function SubtaskItem({ subtask, onToggleComplete, onEdit, onDelete }: SubtaskItemProps) {
  return (
    <div className="flex items-center gap-3 pl-6 py-2 border-l-2 border-muted bg-muted/30 rounded-r-lg">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={() => onToggleComplete(subtask.id, subtask.completed)}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
          {subtask.title}
        </h4>
        {subtask.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {subtask.description}
          </p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(subtask)}
          className="h-6 w-6 p-0"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(subtask.id)}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
