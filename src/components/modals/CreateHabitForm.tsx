
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createHabit } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Habit } from "@/types";

interface CreateHabitFormProps {
  onSuccess: () => void;
  editingHabit?: Habit;
}

export default function CreateHabitForm({ onSuccess, editingHabit }: CreateHabitFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [target, setTarget] = useState("1");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || "");
      setFrequency(editingHabit.frequency);
      setTarget(editingHabit.target.toString());
      setCategory(editingHabit.category || "");
    }
  }, [editingHabit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !frequency) return;

    setIsSubmitting(true);
    try {
      if (editingHabit) {
        // Update existing habit
        const { error } = await supabase
          .from('habits')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            frequency,
            target: parseInt(target),
            category: category || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHabit.id);

        if (error) throw error;

        toast({
          title: "Habitude modifiée",
          description: "Votre habitude a été modifiée avec succès.",
        });
      } else {
        // Create new habit
        const { error } = await createHabit({
          title: title.trim(),
          description: description.trim() || null,
          frequency,
          target: parseInt(target),
          category: category || null,
          user_id: user.id,
          streak: 0,
        });

        if (error) throw error;

        toast({
          title: "Habitude créée",
          description: "Votre habitude a été créée avec succès.",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving habit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'habitude.",
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
          placeholder="Nom de votre habitude"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de votre habitude (optionnel)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="frequency">Fréquence *</Label>
        <Select value={frequency} onValueChange={setFrequency} required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner la fréquence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Quotidienne</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuelle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="target">Objectif quotidien</Label>
        <Input
          id="target"
          type="number"
          min="1"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="1"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="health">Santé</SelectItem>
            <SelectItem value="productivity">Productivité</SelectItem>
            <SelectItem value="personal">Personnel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={isSubmitting || !title.trim() || !frequency} className="w-full">
        {isSubmitting ? "Sauvegarde..." : editingHabit ? "Modifier l'habitude" : "Créer l'habitude"}
      </Button>
    </form>
  );
}
