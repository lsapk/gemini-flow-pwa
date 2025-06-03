
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Clock, Edit, Plus, Target, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import CreateModal from "@/components/modals/CreateModal";

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  progress: number;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState<Partial<Goal>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await getGoals();
      
      if (error) throw error;
      
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos objectifs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      const { data, error } = await updateGoal(selectedGoal.id, {
        ...editedGoal,
        target_date: selectedDate ? selectedDate.toISOString() : undefined,
      });
      
      if (error) throw error;
      
      setGoals(goals.map(goal => goal.id === selectedGoal.id ? { ...goal, ...editedGoal, target_date: selectedDate?.toISOString() } : goal));
      
      toast({
        title: "Objectif mis à jour",
        description: "Votre objectif a été mis à jour avec succès.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'objectif.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const { error } = await deleteGoal(id);
      
      if (error) throw error;
      
      setGoals(goals.filter(goal => goal.id !== id));
      
      toast({
        title: "Objectif supprimé",
        description: "Votre objectif a été supprimé avec succès.",
      });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'objectif.",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (goal: Goal) => {
    try {
      const { data, error } = await updateGoal(goal.id, {
        completed: !goal.completed,
        progress: !goal.completed ? 100 : goal.progress,
      });
      
      if (error) throw error;
      
      setGoals(goals.map(g => g.id === goal.id ? { ...g, completed: !g.completed, progress: !g.completed ? 100 : g.progress } : g));
      
      toast({
        title: goal.completed ? "Objectif réactivé" : "Objectif complété",
        description: goal.completed ? "Votre objectif a été marqué comme non complété." : "Félicitations pour avoir atteint votre objectif !",
      });
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'état de l'objectif.",
        variant: "destructive",
      });
    }
  };

  const handleProgressChange = async (id: string, progress: number) => {
    try {
      const { data, error } = await updateGoal(id, {
        progress,
        completed: progress === 100,
      });
      
      if (error) throw error;
      
      setGoals(goals.map(goal => goal.id === id ? { ...goal, progress, completed: progress === 100 } : goal));
    } catch (error) {
      console.error("Error updating goal progress:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la progression.",
        variant: "destructive",
      });
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === "all") return true;
    if (filter === "completed") return goal.completed;
    if (filter === "in-progress") return !goal.completed;
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "personal":
        return "bg-blue-100 text-blue-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      case "health":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "personal":
        return "Personnel";
      case "professional":
        return "Professionnel";
      case "health":
        return "Santé";
      default:
        return "Autre";
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Objectifs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Définissez et atteignez vos objectifs à long terme
          </p>
        </div>
        
        <CreateModal
          type="goal"
          onSuccess={fetchGoals}
        />
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-indigo-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-900">{goals.length}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-indigo-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Atteints</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">
                  {goals.filter(g => g.completed).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">🏆</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-600">En cours</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-900">
                  {goals.filter(g => !g.completed).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-600">Progression</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">
                  {goals.length > 0 ? Math.round((goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)) : 0}%
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Vos objectifs</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les objectifs</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="completed">Complétés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 rounded-md border">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGoals.length > 0 ? (
            <div className="space-y-4">
              {filteredGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    goal.completed ? "bg-green-50 border-green-200" : "bg-white"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={goal.completed}
                            onCheckedChange={() => handleToggleComplete(goal)}
                            className={goal.completed ? "bg-green-600 text-white border-green-600" : ""}
                          />
                          <h3 className={cn(
                            "font-medium",
                            goal.completed && "line-through text-muted-foreground"
                          )}>
                            {goal.title}
                          </h3>
                        </div>
                        <Badge className={getCategoryColor(goal.category)}>
                          {getCategoryLabel(goal.category)}
                        </Badge>
                      </div>
                      
                      {goal.description && (
                        <p className="text-sm text-muted-foreground ml-6">
                          {goal.description}
                        </p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 ml-6">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Target className="h-3 w-3 mr-1" />
                          <span>Progression: {goal.progress}%</span>
                        </div>
                        
                        {goal.target_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Échéance: {format(new Date(goal.target_date), "dd MMM yyyy", { locale: fr })}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 pr-4">
                        <Slider
                          value={[goal.progress]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => handleProgressChange(goal.id, value[0])}
                          disabled={goal.completed}
                          className={goal.completed ? "opacity-50" : ""}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => {
                            setSelectedGoal(goal);
                            setEditedGoal({
                              title: goal.title,
                              description: goal.description,
                              category: goal.category,
                              progress: goal.progress,
                              completed: goal.completed,
                            });
                            setSelectedDate(goal.target_date ? new Date(goal.target_date) : undefined);
                            setIsEditing(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Modifier l'objectif</DialogTitle>
                            <DialogDescription>
                              Modifiez les détails de votre objectif.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Titre</Label>
                              <Input
                                id="title"
                                value={editedGoal.title || ""}
                                onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="description">Description (optionnelle)</Label>
                              <Textarea
                                id="description"
                                value={editedGoal.description || ""}
                                onChange={(e) => setEditedGoal({ ...editedGoal, description: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="category">Catégorie</Label>
                              <Select
                                value={editedGoal.category}
                                onValueChange={(value) => setEditedGoal({ ...editedGoal, category: value })}
                              >
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
                            
                            <div className="space-y-2">
                              <Label>Date cible (optionnelle)</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? (
                                      format(selectedDate, "P", { locale: fr })
                                    ) : (
                                      <span>Choisir une date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Progression ({editedGoal.progress || 0}%)</Label>
                              <Slider
                                value={[editedGoal.progress || 0]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) => setEditedGoal({ ...editedGoal, progress: value[0] })}
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="completed"
                                checked={editedGoal.completed}
                                onCheckedChange={(checked) => setEditedGoal({ ...editedGoal, completed: !!checked })}
                              />
                              <Label htmlFor="completed">Objectif atteint</Label>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handleUpdateGoal}>
                              Enregistrer
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action ne peut pas être annulée. Cela supprimera définitivement cet objectif.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Aucun objectif</h3>
              <p className="text-muted-foreground mb-4">
                Définissez vos premiers objectifs pour suivre votre progression.
              </p>
              <CreateModal
                type="goal"
                onSuccess={fetchGoals}
                variant="default"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un objectif
              </CreateModal>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
