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
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DragHandle } from "@/components/DragHandle";
import { Goal } from "@/types";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { Plus, PlusCircle, Target, Calendar, CheckCircle2, Edit, Trash2, Eye, EyeOff } from "lucide-react";
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
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Séparer les objectifs en cours et terminés
  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);
  
  const dragAndDrop = useDragAndDrop(activeGoals, 'goals', fetchGoals);

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

  const renderGoalCard = (goal: Goal, index: number, isCompleted = false) => (
    <Card 
      key={goal.id}
      draggable={!isCompleted}
      onDragStart={!isCompleted ? (e) => dragAndDrop.handleDragStart(e, goal.id, index) : undefined}
      onDragOver={!isCompleted ? dragAndDrop.handleDragOver : undefined}
      onDrop={!isCompleted ? (e) => dragAndDrop.handleDrop(e, index) : undefined}
      className={`transition-all duration-200 ${
        isCompleted ? 'bg-green-50 border-green-200' : ''
      } ${
        dragAndDrop.draggedItem?.id === goal.id ? 'opacity-50 scale-95' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {!isCompleted && (
            <DragHandle
              onDragStart={(e) => dragAndDrop.handleDragStart(e, goal.id, index)}
              onTouchStart={() => dragAndDrop.handleTouchStart(goal.id, index)}
              onTouchMove={dragAndDrop.handleTouchMove}
              onTouchEnd={() => dragAndDrop.handleTouchEnd(index)}
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${isCompleted ? 'text-green-700' : ''}`}>
                  {goal.title}
                  {isCompleted && <CheckCircle2 className="inline ml-2 h-5 w-5 text-green-600" />}
                </h3>
                {goal.description && (
                  <p className={`text-sm mt-1 ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {goal.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => editGoal(goal)}
                  size="sm"
                  variant="ghost"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(goal.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isCompleted ? 'text-green-600' : 'text-muted-foreground'}>Progrès</span>
                  <span className={`font-medium ${isCompleted ? 'text-green-700' : ''}`}>{goal.progress}%</span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className={`h-2 ${isCompleted ? 'bg-green-100' : ''}`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {goal.category && (
                  <Badge variant={isCompleted ? "default" : "secondary"}>
                    {goal.category}
                  </Badge>
                )}
                {goal.target_date && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-green-600 text-white">
                    Terminé
                  </Badge>
                )}
              </div>

              {!isCompleted && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 10))}
                    size="sm"
                    variant="outline"
                  >
                    +10%
                  </Button>
                  <Button
                    onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 25))}
                    size="sm"
                    variant="outline"
                  >
                    +25%
                  </Button>
                  <Button
                    onClick={() => handleProgressUpdate(goal.id, 100)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Terminer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Objectifs</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCompleted(!showCompleted)}
            variant="outline"
            size="sm"
          >
            {showCompleted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showCompleted ? 'Masquer terminés' : 'Voir terminés'}
          </Button>
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
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progrès moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objectifs en cours */}
      <div>
        <h2 className="text-xl font-semibold mb-4">En cours</h2>
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun objectif en cours</h3>
              <p className="text-muted-foreground text-center mb-4">
                Créez votre premier objectif pour commencer à atteindre vos ambitions.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier objectif
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal, index) => renderGoalCard(goal, index, false))}
          </div>
        )}
      </div>

      {/* Objectifs terminés */}
      {showCompleted && completedGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-700">Terminés</h2>
          <div className="space-y-4">
            {completedGoals.map((goal, index) => renderGoalCard(goal, index, true))}
          </div>
        </div>
      )}
    </div>
  );
}
