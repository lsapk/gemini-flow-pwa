import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Goal } from "@/types";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { Plus, PlusCircle, Target, Calendar, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GoalList from "@/components/GoalList";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await getGoals();
      
      if (error) throw new Error(error.message);
      
      setGoals(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos objectifs.",
        variant: "destructive",
      });
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !category) return;

    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        target_date: targetDate || null,
        user_id: user.id,
        progress: editingGoal?.progress || 0,
        completed: editingGoal?.completed || false,
      };

      if (editingGoal) {
        const { error } = await updateGoal(editingGoal.id, goalData);
        if (error) throw error;
        
        toast({
          title: "Objectif modifié",
          description: "Votre objectif a été modifié avec succès.",
        });
      } else {
        const { error } = await createGoal(goalData);
        if (error) throw error;
        
        toast({
          title: "Objectif créé",
          description: "Votre objectif a été créé avec succès.",
        });
      }
      
      resetForm();
      fetchGoals();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'objectif.",
        variant: "destructive",
      });
      console.error("Error saving goal:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteGoal(id);
      if (error) throw error;
      
      setGoals(goals.filter((goal) => goal.id !== id));
      toast({
        title: "Objectif supprimé",
        description: "Votre objectif a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'objectif.",
        variant: "destructive",
      });
      console.error("Error deleting goal:", error);
    }
  };

  const handleProgressUpdate = async (goalId: string, newProgress: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const { error } = await updateGoal(goalId, {
        ...goal,
        progress: newProgress,
        completed: newProgress >= 100,
      });
      
      if (error) throw error;
      
      fetchGoals();
      toast({
        title: "Progrès mis à jour",
        description: `Progrès mis à jour à ${newProgress}%`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le progrès.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTargetDate("");
    setEditingGoal(null);
    setIsFormOpen(false);
  };

  const editGoal = (goal: Goal) => {
    setTitle(goal.title);
    setDescription(goal.description || "");
    setCategory(goal.category || "");
    setTargetDate(goal.target_date ? goal.target_date.split('T')[0] : "");
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0;

  // On retire les cartes résumé de l'ancienne version et la grid pour utiliser GoalList
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Objectifs</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsFormOpen(true)}
              size="sm"
              className="bg-[#715FFA] hover:bg-[#715FFA]/90 text-white font-semibold rounded-lg px-5 py-2 flex gap-2 items-center transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvel objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-0 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Modifier l'objectif" : "Nouvel objectif"}
              </DialogTitle>
            </DialogHeader>
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
                    <SelectItem value="financial">Financier</SelectItem>
                    <SelectItem value="education">Éducation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetDate">Date cible</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingGoal ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GoalList avec cards résumé et liste */}
      <GoalList
        goals={goals}
        loading={loading}
        onEdit={editGoal}
        onDelete={handleDelete}
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
}
