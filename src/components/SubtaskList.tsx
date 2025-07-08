
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onRefresh: () => void;
}

export default function SubtaskList({ taskId, subtasks, onRefresh }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const createSubtask = async () => {
    if (!user || !newSubtaskTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .insert({
          parent_task_id: taskId,
          title: newSubtaskTitle.trim(),
          user_id: user.id,
          sort_order: subtasks.length
        });

      if (error) throw error;

      setNewSubtaskTitle("");
      setIsCreating(false);
      onRefresh();
      toast.success('Sous-tâche créée !');
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Erreur lors de la création');
    }
  };

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

  const startEditing = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const saveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;

    await updateSubtask(editingId, { title: editingTitle.trim() });
    setEditingId(null);
    setEditingTitle("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <div className="space-y-2 ml-6 mt-2">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={(checked) => 
              updateSubtask(subtask.id, { completed: !!checked })
            }
          />
          
          {editingId === subtask.id ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
              <Button size="sm" variant="ghost" onClick={saveEdit}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                {subtask.title}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(subtask)}
                  className="h-6 w-6"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSubtask(subtask.id)}
                  className="h-6 w-6"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {isCreating ? (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Nouvelle sous-tâche"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') createSubtask();
              if (e.key === 'Escape') setIsCreating(false);
            }}
          />
          <Button size="sm" variant="ghost" onClick={createSubtask}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsCreating(true)}
          className="text-xs text-muted-foreground"
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajouter une sous-tâche
        </Button>
      )}
    </div>
  );
}
