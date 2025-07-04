
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

export default function SubTaskForm({ parentTaskId, onSubTaskCreated }: SubTaskFormProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          user_id: user.id,
          parent_task_id: parentTaskId,
          completed: false,
          priority: 'medium' as const,
        });

      if (error) throw error;

      setTitle("");
      onSubTaskCreated();
      toast.success('Sous-tâche créée !');
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Erreur lors de la création de la sous-tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ajouter une sous-tâche..."
        className="flex-1 text-sm"
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        size="sm"
        disabled={isSubmitting || !title.trim()}
        className="px-3"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
