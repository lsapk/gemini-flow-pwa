
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SubTaskButtonProps {
  taskId: string;
  subtasksCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSubTaskCreated: () => void;
}

export default function SubTaskButton({ 
  taskId, 
  subtasksCount, 
  isExpanded, 
  onToggleExpanded, 
  onSubTaskCreated 
}: SubTaskButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleCreateSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          user_id: user.id,
          parent_task_id: taskId,
          completed: false,
          priority: 'medium' as const,
        });

      if (error) throw error;

      setTitle("");
      setShowInput(false);
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
    <div className="flex items-center gap-2">
      {subtasksCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          className="h-6 px-2 text-xs"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          {subtasksCount} sous-tâche{subtasksCount > 1 ? 's' : ''}
        </Button>
      )}
      
      {!showInput ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          className="h-6 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Sous-tâche
        </Button>
      ) : (
        <form onSubmit={handleCreateSubTask} className="flex items-center gap-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nouvelle sous-tâche..."
            className="h-6 text-xs w-32"
            disabled={isSubmitting}
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !title.trim()}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowInput(false);
              setTitle("");
            }}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </form>
      )}
    </div>
  );
}
