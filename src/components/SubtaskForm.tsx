
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  description?: string;
  priority?: string;
}

interface SubtaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onRefresh: () => void;
  editingSubtask?: Subtask | null;
}

export function SubtaskForm({ isOpen, onClose, taskId, onRefresh, editingSubtask }: SubtaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (editingSubtask) {
      setTitle(editingSubtask.title);
      setDescription(editingSubtask.description || "");
      setPriority(editingSubtask.priority || "medium");
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
    }
  }, [editingSubtask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);

    try {
      if (editingSubtask) {
        const { error } = await supabase
          .from('subtasks')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            priority
          })
          .eq('id', editingSubtask.id);

        if (error) throw error;
        toast.success('Sous-tâche modifiée !');
      } else {
        const { error } = await supabase
          .from('subtasks')
          .insert({
            task_id: taskId,
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            priority,
            completed: false,
            sort_order: 0
          });

        if (error) throw error;
        toast.success('Sous-tâche créée !');
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving subtask:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSubtask ? 'Modifier la sous-tâche' : 'Nouvelle sous-tâche'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la sous-tâche"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Sauvegarde...' : editingSubtask ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
