
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SubTaskFormProps {
  parentTaskId: string;
  onSubTaskCreated: () => void;
}

export const SubTaskForm = ({ parentTaskId, onSubTaskCreated }: SubTaskFormProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          user_id: user.id,
          parent_task_id: parentTaskId,
          completed: false,
          sort_order: 0
        });

      if (error) throw error;

      setTitle("");
      setIsAdding(false);
      onSubTaskCreated();
      toast.success('Sous-tâche créée');
    } catch (error) {
      console.error('Erreur lors de la création de la sous-tâche:', error);
      toast.error('Erreur lors de la création de la sous-tâche');
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3 mr-1" />
        Ajouter une sous-tâche
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de la sous-tâche"
        className="text-sm"
        autoFocus
      />
      <Button type="submit" size="sm" disabled={!title.trim()}>
        <Plus className="h-3 w-3" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        onClick={() => {
          setIsAdding(false);
          setTitle("");
        }}
      >
        Annuler
      </Button>
    </form>
  );
};
