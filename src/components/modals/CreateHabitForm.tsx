
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Habit } from "@/types";

interface CreateHabitFormProps {
  onSuccess: () => void;
  habit?: Habit | null;
}

interface Goal {
  id: string;
  title: string;
}

export default function CreateHabitForm({ onSuccess, habit }: CreateHabitFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    category: '',
    target: 1,
    linked_goal_id: 'none',
    days_of_week: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title,
        description: habit.description || '',
        frequency: habit.frequency,
        category: habit.category || '',
        target: habit.target,
        linked_goal_id: 'none',
        days_of_week: habit.days_of_week || []
      });
      
      // Charger la liaison avec l'objectif pour les habitudes existantes
      fetchHabitGoalLink(habit.id);
    } else {
      setFormData({
        title: '',
        description: '',
        frequency: 'daily',
        category: '',
        target: 1,
        linked_goal_id: 'none',
        days_of_week: []
      });
    }

    fetchGoals();
  }, [habit]);

  const fetchHabitGoalLink = async (habitId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('linked_goal_id')
        .eq('id', habitId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setFormData(prev => ({
        ...prev,
        linked_goal_id: data?.linked_goal_id || 'none'
      }));
    } catch (error) {
      console.error('Error fetching habit goal link:', error);
      setFormData(prev => ({
        ...prev,
        linked_goal_id: 'none'
      }));
    }
  };

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

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
        user_id: user.id,
        linked_goal_id: formData.linked_goal_id === 'none' ? null : formData.linked_goal_id,
        days_of_week: formData.days_of_week.length > 0 ? formData.days_of_week : null
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

      {formData.frequency !== 'daily' && (
        <div>
          <Label>Jours de la semaine</Label>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {[
              { label: 'Dim', value: 0 },
              { label: 'Lun', value: 1 },
              { label: 'Mar', value: 2 },
              { label: 'Mer', value: 3 },
              { label: 'Jeu', value: 4 },
              { label: 'Ven', value: 5 },
              { label: 'Sam', value: 6 }
            ].map((day) => (
              <div key={day.value} className="flex flex-col items-center space-y-1">
                <span className="text-xs text-muted-foreground">{day.label}</span>
                <Checkbox
                  checked={formData.days_of_week.includes(day.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        days_of_week: [...prev.days_of_week, day.value].sort()
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        days_of_week: prev.days_of_week.filter(d => d !== day.value)
                      }));
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="linked_goal">Lier à un objectif</Label>
        <Select
          value={formData.linked_goal_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, linked_goal_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un objectif (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun objectif</SelectItem>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sauvegarde..." : (habit ? "Modifier" : "Créer")}
      </Button>
    </form>
  );
}
