
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types";

interface CreateTaskFormProps {
  onSuccess: () => void;
  task?: Task | null;
}

interface Goal {
  id: string;
  title: string;
}

export default function CreateTaskForm({ onSuccess, task }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [linkedGoalId, setLinkedGoalId] = useState("none");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "");
      
      // Charger la liaison avec l'objectif pour les tâches existantes
      fetchTaskGoalLink(task.id);
    }

    fetchGoals();
  }, [task]);

  const fetchTaskGoalLink = async (taskId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('linked_goal_id')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setLinkedGoalId(data?.linked_goal_id || "none");
    } catch (error) {
      console.error('Error fetching task goal link:', error);
      setLinkedGoalId("none");
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
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        user_id: user.id,
        linked_goal_id: linkedGoalId === "none" ? null : linkedGoalId,
      };

      let error;
      if (task) {
        // Update existing task
        ({ error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .eq('user_id', user.id));
      } else {
        // Create new task
        ({ error } = await supabase
          .from('tasks')
          .insert(taskData));
      }

      if (error) throw error;

      toast.success(task ? 'Tâche modifiée !' : 'Tâche créée !');
      onSuccess();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Erreur lors de la sauvegarde de la tâche");
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
        <Label htmlFor="priority">Priorité *</Label>
        <Select value={priority} onValueChange={(value: "high" | "medium" | "low") => setPriority(value)} required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Date d'échéance</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linked_goal">Lier à un objectif</Label>
        <Select
          value={linkedGoalId}
          onValueChange={setLinkedGoalId}
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
      
      <Button type="submit" disabled={isSubmitting || !title.trim()} className="w-full">
        {isSubmitting ? "Sauvegarde..." : task ? "Modifier la tâche" : "Créer la tâche"}
      </Button>
    </form>
  );
}
