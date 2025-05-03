
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Target, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { TargetIcon } from "@/components/icons/DeepFlowIcons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getGoals, addGoal, updateGoal, deleteGoal } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Goal types and categories
const goalCategories = [
  { value: "personal", label: "Personnel" },
  { value: "professional", label: "Professionnel" },
  { value: "health", label: "Santé" },
  { value: "financial", label: "Finance" },
  { value: "learning", label: "Apprentissage" },
  { value: "other", label: "Autre" }
];

interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  progress: number;
  completed: boolean;
  user_id: string;
}

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  target_date: Date | undefined;
}

const GoalEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mx-auto rounded-full bg-primary/10 p-4">
      <Target className="h-8 w-8 text-primary" />
    </div>
    <h3 className="mt-4 text-lg font-medium">Aucun objectif</h3>
    <p className="mb-4 mt-2 text-sm text-muted-foreground">
      Commencez par créer votre premier objectif pour suivre votre progression.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvel objectif
    </Button>
  </Card>
);

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    category: "",
    target_date: undefined,
  });
  
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

  const handleCreateGoal = async () => {
    if (!user) return;
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre pour votre objectif.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newGoal = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        target_date: formData.target_date ? formData.target_date.toISOString() : null,
        progress: 0,
        completed: false,
        user_id: user.id,
      };
      
      const { data, error } = await addGoal(newGoal);
      
      if (error) throw new Error(error.message);
      
      setGoals([...(data ? [data] : []), ...goals]);
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Objectif créé",
        description: "Votre nouvel objectif a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'objectif.",
        variant: "destructive",
      });
      console.error("Error creating goal:", error);
    }
  };

  const handleUpdateGoal = async () => {
    if (!user || !editingGoal) return;
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre pour votre objectif.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedGoal = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        target_date: formData.target_date ? formData.target_date.toISOString() : null,
      };
      
      const { data, error } = await updateGoal(editingGoal.id, updatedGoal);
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setGoals(goals.map((goal) => (goal.id === editingGoal.id ? data : goal)));
      }
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Objectif mis à jour",
        description: "Votre objectif a été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'objectif.",
        variant: "destructive",
      });
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const { error } = await deleteGoal(id);
      
      if (error) throw new Error(error.message);
      
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

  const handleUpdateProgress = async (id: string, progress: number) => {
    try {
      const { data, error } = await updateGoal(id, {
        progress: progress,
        completed: progress === 100,
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setGoals(goals.map((goal) => (goal.id === id ? data : goal)));
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la progression.",
        variant: "destructive",
      });
      console.error("Error updating progress:", error);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const { data, error } = await updateGoal(id, {
        completed,
        progress: completed ? 100 : 0,
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setGoals(goals.map((goal) => (goal.id === id ? data : goal)));
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'état de l'objectif.",
        variant: "destructive",
      });
      console.error("Error toggling goal completion:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      target_date: undefined,
    });
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category || "",
      target_date: goal.target_date ? new Date(goal.target_date) : undefined,
    });
    setOpenDialog(true);
  };

  // Group goals by category
  const groupedGoals = goals.reduce((acc, goal) => {
    const category = goal.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(goal);
    return acc;
  }, {} as Record<string, Goal[]>);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TargetIcon className="h-8 w-8" />
            Objectifs
          </h1>
          <p className="text-muted-foreground">
            Définissez vos objectifs à long terme et suivez votre progression.
          </p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvel objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Modifier l'objectif" : "Nouvel objectif"}</DialogTitle>
              <DialogDescription>
                {editingGoal
                  ? "Modifiez les détails de votre objectif."
                  : "Créez un nouvel objectif pour suivre votre progression."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Courir un marathon"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre objectif..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date cible</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.target_date ? (
                          format(formData.target_date, "P", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.target_date}
                        onSelect={(date) => setFormData({ ...formData, target_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm();
                setOpenDialog(false);
              }}>
                Annuler
              </Button>
              <Button onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}>
                {editingGoal ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <GoalEmptyState onCreate={() => setOpenDialog(true)} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedGoals).map(([category, categoryGoals]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold">
                  {goalCategories.find(c => c.value === category)?.label || "Autre"}
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {categoryGoals.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryGoals.map((goal) => (
                  <Card key={goal.id} className={`${goal.completed ? "border-green-500/30 bg-green-50/50 dark:bg-green-900/10" : "glass-card"} transition-all duration-300`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {goal.title}
                            {goal.completed && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </CardTitle>
                          {goal.target_date && (
                            <CardDescription>
                              Échéance: {format(new Date(goal.target_date), "PP", { locale: fr })}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(goal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action ne peut pas être annulée. Cela supprimera définitivement votre objectif.
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
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progression</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleComplete(goal.id, !goal.completed)}
                        >
                          {goal.completed ? "Réactiver" : "Terminer"}
                        </Button>
                      </div>
                      
                      {!goal.completed && (
                        <Select 
                          value={goal.progress.toString()} 
                          onValueChange={(value) => handleUpdateProgress(goal.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Progression" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="25">25%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="75">75%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Goals;
