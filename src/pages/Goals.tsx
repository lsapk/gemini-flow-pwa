
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
import { PlusCircle, Target, Calendar, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Objectifs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Définissez et suivez vos objectifs pour atteindre vos ambitions
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">{goals.length}</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Terminés</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">{completedGoals}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-600">Progrès moyen</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-900">{Math.round(avgProgress)}%</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-600">En cours</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{goals.length - completedGoals}</p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>Vos objectifs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun objectif défini</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier objectif
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer un objectif
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{goal.title}</h3>
                        {goal.completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                      )}
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">{goal.category}</Badge>
                        {goal.target_date && (
                          <Badge variant="secondary">
                            {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: fr })}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editGoal(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progrès</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProgressUpdate(goal.id, Math.max(0, goal.progress - 10))}
                      >
                        -10%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 10))}
                      >
                        +10%
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleProgressUpdate(goal.id, 100)}
                        disabled={goal.completed}
                      >
                        Terminer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
