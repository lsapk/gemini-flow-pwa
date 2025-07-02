
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CreateTaskFormProps {
  onSuccess: () => void;
}

export default function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          user_id: user.id,
          completed: false,
        });

      if (error) throw error;

      toast({
        title: "Tâche créée",
        description: "Votre tâche a été créée avec succès.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom de votre tâche"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de votre tâche (optionnel)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="priority">Priorité</Label>
        <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner la priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={isSubmitting || !title.trim()} className="w-full">
        {isSubmitting ? "Création..." : "Créer la tâche"}
      </Button>
    </form>
  );
}
