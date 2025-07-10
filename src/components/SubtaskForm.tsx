
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SubtaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onRefresh: () => void;
  editingSubtask?: any;
}

export default function SubtaskForm({ isOpen, onClose, taskId, onRefresh, editingSubtask }: SubtaskFormProps) {
  const [title, setTitle] = useState(editingSubtask?.title || "");
  const [description, setDescription] = useState(editingSubtask?.description || "");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(editingSubtask?.priority || 'medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const subtaskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        parent_task_id: taskId,
        user_id: user.id,
        sort_order: editingSubtask?.sort_order || 0
      };

      if (editingSubtask) {
        const { error } = await supabase
          .from('subtasks')
          .update(subtaskData)
          .eq('id', editingSubtask.id);

        if (error) throw error;

        toast({
          title: "Sous-tâche modifiée",
          description: "Votre sous-tâche a été modifiée avec succès.",
        });
      } else {
        const { error } = await supabase
          .from('subtasks')
          .insert(subtaskData);

        if (error) throw error;

        toast({
          title: "Sous-tâche créée",
          description: "Votre sous-tâche a été créée avec succès.",
        });
      }

      onRefresh();
      onClose();
      setTitle("");
      setDescription("");
      setPriority('medium');
    } catch (error) {
      console.error("Error saving subtask:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la sous-tâche.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTitle("");
    setDescription("");
    setPriority('medium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="mx-2 sm:mx-0 max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSubtask ? "Modifier la sous-tâche" : "Nouvelle sous-tâche"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de votre sous-tâche"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de votre sous-tâche (optionnel)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 Élevée</SelectItem>
                <SelectItem value="medium">🟡 Moyenne</SelectItem>
                <SelectItem value="low">🟢 Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !title.trim()} className="flex-1">
              {isSubmitting ? (editingSubtask ? "Modification..." : "Création...") : (editingSubtask ? "Modifier" : "Créer")}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
