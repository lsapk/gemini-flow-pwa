
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createGoal } from "@/lib/api";

interface CreateGoalFormProps {
  onSuccess: () => void;
}

export default function CreateGoalForm({ onSuccess }: CreateGoalFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !category) return;

    setIsSubmitting(true);
    try {
      const { error } = await createGoal({
        title: title.trim(),
        description: description.trim() || null,
        category,
        user_id: user.id,
        progress: 0,
        completed: false,
      });

      if (error) throw error;

      toast({
        title: "Objectif créé",
        description: "Votre objectif a été créé avec succès.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'objectif.",
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
      
      <Button type="submit" disabled={isSubmitting || !title.trim() || !category} className="w-full">
        {isSubmitting ? "Création..." : "Créer l'objectif"}
      </Button>
    </form>
  );
}
