
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Habit } from "@/types";

interface CreateHabitFormProps {
  onSuccess: () => void;
  habit?: Habit | null;
}

export default function CreateHabitForm({ onSuccess, habit }: CreateHabitFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    category: '',
    target: 1
  });
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title,
        description: habit.description || '',
        frequency: habit.frequency,
        category: habit.category || '',
        target: habit.target
      });
    } else {
      setFormData({
        title: '',
        description: '',
        frequency: 'daily',
        category: '',
        target: 1
      });
    }
  }, [habit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const habitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        frequency: formData.frequency,
        category: formData.category.trim() || null,
        target: formData.target,
        user_id: user.id
      };

      if (habit) {
        // Modifier l'habitude existante
        const { error } = await supabase
          .from('habits')
          .update({
            ...habitData,
            updated_at: new Date().toISOString()
          })
          .eq('id', habit.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Habitude modifiée",
          description: "Votre habitude a été mise à jour avec succès.",
        });
      } else {
        // Créer une nouvelle habitude
        const { error } = await supabase
          .from('habits')
          .insert(habitData);

        if (error) throw error;

        toast({
          title: "Habitude créée",
          description: "Votre nouvelle habitude a été créée avec succès.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving habit:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'habitude.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Faire du sport"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description optionnelle de l'habitude"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="frequency">Fréquence *</Label>
        <Select
          value={formData.frequency}
          onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir la fréquence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Quotidienne</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuelle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category">Catégorie</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="Ex: Santé, Travail, Personnel"
        />
      </div>

      <div>
        <Label htmlFor="target">Objectif numérique</Label>
        <Input
          id="target"
          type="number"
          min="1"
          value={formData.target}
          onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
          placeholder="1"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sauvegarde..." : (habit ? "Modifier" : "Créer")}
      </Button>
    </form>
  );
}
