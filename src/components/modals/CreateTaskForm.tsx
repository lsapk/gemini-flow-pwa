
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toLocalDateKey } from "@/utils/dateUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAIItemAssistant } from "@/hooks/useAIItemAssistant";
import { Task } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";

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
  const { suggest, isLoading: isAILoading } = useAIItemAssistant();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "");
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

  const handleAISuggest = async () => {
    if (!title.trim()) {
      toast.error("Entrez d'abord un titre.");
      return;
    }
    const result = await suggest({ type: "task", title });
    if (result && 'priority' in result) {
      if (result.description) setDescription(result.description);
      if (result.priority) setPriority(result.priority);
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
        ({ error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .eq('user_id', user.id));
      } else {
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
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAISuggest}
            disabled={isAILoading || !title.trim()}
            className="h-7 gap-1.5 text-xs text-primary hover:text-primary/80"
          >
            {isAILoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isAILoading ? "Génération..." : "✨ Remplir avec l'IA"}
          </Button>
        </div>
        {isAILoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de votre tâche (optionnel)"
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="priority">Priorité *</Label>
        {isAILoading ? (
          <Skeleton className="h-10 w-full rounded-xl" />
        ) : (
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
        )}
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
        <Select value={linkedGoalId} onValueChange={setLinkedGoalId}>
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
