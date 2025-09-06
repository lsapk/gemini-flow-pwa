import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SubtaskForm } from "./SubtaskForm";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  description?: string;
  priority?: string;
}

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onRefresh: () => void;
}

export function SubtaskList({ taskId, subtasks, onRefresh }: SubtaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const { user } = useAuth();

  const updateSubtask = async (id: string, updates: Partial<Subtask>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      onRefresh();
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteSubtask = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onRefresh();
      toast.success('Sous-tâche supprimée !');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubtask(null);
  };

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-muted/50">
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={(checked) => 
              updateSubtask(subtask.id, { completed: !!checked })
            }
          />
          
          <div className="flex-1 flex items-center justify-between">
            <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
              {subtask.title}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(subtask)}
                className="h-6 w-6 p-0"
                title="Modifier"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteSubtask(subtask.id)}
                className="h-6 w-6 p-0"
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsFormOpen(true)}
        className="text-xs text-muted-foreground h-6 px-2 w-full justify-center border border-dashed border-muted"
      >
        <Plus className="h-3 w-3 mr-1" />
        Ajouter une sous-tâche
      </Button>

      <SubtaskForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        taskId={taskId}
        onRefresh={onRefresh}
        editingSubtask={editingSubtask}
      />
    </div>
  );
}