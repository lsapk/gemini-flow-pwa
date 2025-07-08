
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Goal } from "@/types";

interface CreateGoalFormProps {
  onSuccess: () => void;
  initialGoal?: Goal | null;
}

export default function CreateGoalForm({ onSuccess, initialGoal }: CreateGoalFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || "");
      setCategory(initialGoal.category);
      setProgress(initialGoal.progress || 0);
      setCompleted(initialGoal.completed);
    }
  }, [initialGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !category) return;

    setIsSubmitting(true);
    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        progress,
        completed,
        user_id: user.id,
      };

      let error;
      if (initialGoal) {
        // Update existing goal
        ({ error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', initialGoal.id)
          .eq('user_id', user.id));
      } else {
        // Create new goal
        ({ error } = await supabase
          .from('goals')
          .insert(goalData));
      }

      if (error) throw error;

      toast.success(initialGoal ? 'Objectif modifié !' : 'Objectif créé !');
      onSuccess();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Erreur lors de la sauvegarde de l'objectif");
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
          placeholder="Nom de votre objectif"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de votre objectif (optionnel)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie *</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personnel</SelectItem>
            <SelectItem value="professional">Professionnel</SelectItem>
            <SelectItem value="health">Santé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {initialGoal && (
        <>
          <div className="space-y-2">
            <Label htmlFor="progress">Progrès (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="completed"
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="completed">Objectif terminé</Label>
          </div>
        </>
      )}
      
      <Button type="submit" disabled={isSubmitting || !title.trim() || !category} className="w-full">
        {isSubmitting ? "Sauvegarde..." : initialGoal ? "Modifier l'objectif" : "Créer l'objectif"}
      </Button>
    </form>
  );
}
