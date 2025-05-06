
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, isToday, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Flag, PlusCircle, Trash2, Calendar as CalendarIcon2, LineChart, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// Catégories d'objectifs
const categoryOptions = [
  { value: "career", label: "Carrière", icon: "💼" },
  { value: "education", label: "Éducation", icon: "🎓" },
  { value: "finance", label: "Finances", icon: "💰" },
  { value: "health", label: "Santé", icon: "🏥" },
  { value: "personal", label: "Personnel", icon: "🌱" },
  { value: "other", label: "Autre", icon: "🔍" }
];

interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  completed: boolean;
  progress: number;
  user_id: string;
  created_at: string;
}

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  target_date: Date | undefined;
  progress: number;
}

const GoalsEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <Target className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucun objectif</h3>
    <p className="text-muted-foreground mb-4">
      Commencez par créer votre premier objectif pour suivre vos aspirations.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvel objectif
    </Button>
  </div>
);

const CategoryBadge = ({ category }: { category?: string }) => {
  if (!category) return null;
  
  const categoryOption = categoryOptions.find((option) => option.value === category);
  
  return (
    <Badge variant="outline" className="bg-primary/5 text-primary">
      {categoryOption?.icon} {categoryOption?.label || ""}
    </Badge>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    category: "",
    target_date: undefined,
    progress: 0,
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
        completed: false,
        progress: formData.progress || 0,
        user_id: user.id,
      };
      
      const { data, error } = await createGoal(newGoal);
      
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
      // Déterminer si l'objectif est complété en fonction du progrès
      const isCompleted = formData.progress >= 100;

      const updatedGoal = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        target_date: formData.target_date ? formData.target_date.toISOString() : null,
        progress: formData.progress,
        completed: isCompleted,
      };
      
      const { data, error } = await updateGoal(editingGoal.id, updatedGoal);
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setGoals(goals.map((goal) => (goal.id === editingGoal.id ? data : goal)));
      }
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: isCompleted ? "Objectif atteint ! 🎉" : "Objectif mis à jour",
        description: isCompleted 
          ? "Félicitations ! Vous avez atteint votre objectif."
          : "Votre objectif a été mis à jour avec succès.",
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
  
  const updateGoalProgress = async (goal: Goal, newProgress: number) => {
    try {
      // Déterminer si l'objectif est complété avec le nouveau progrès
      const isCompleted = newProgress >= 100;

      const { data, error } = await updateGoal(goal.id, {
        progress: newProgress,
        completed: isCompleted,
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setGoals(goals.map((g) => (g.id === goal.id ? data : g)));
        
        if (isCompleted && !goal.completed) {
          toast({
            title: "Objectif atteint ! 🎉",
            description: "Félicitations ! Vous avez atteint votre objectif.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la progression.",
        variant: "destructive",
      });
      console.error("Error updating goal progress:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      target_date: undefined,
      progress: 0,
    });
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category || "",
      target_date: goal.target_date ? parseISO(goal.target_date) : undefined,
      progress: goal.progress || 0,
    });
    setOpenDialog(true);
  };

  // Filtrer les objectifs en fonction de l'onglet actif
  const filteredGoals = goals.filter((goal) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !goal.completed;
    if (activeTab === "completed") return goal.completed;
    if (activeTab === "dueThisMonth") {
      if (!goal.target_date) return false;
      const targetDate = new Date(goal.target_date);
      const today = new Date();
      return targetDate.getMonth() === today.getMonth() && 
             targetDate.getFullYear() === today.getFullYear() &&
             !goal.completed;
    }
    return true;
  });
  
  // Compter les objectifs par statut
  const activeCount = goals.filter((goal) => !goal.completed).length;
  const completedCount = goals.filter((goal) => goal.completed).length;
  
  // Calculer les objectifs dus ce mois-ci
  const today = new Date();
  const dueThisMonthCount = goals.filter(goal => {
    if (!goal.target_date || goal.completed) return false;
    const targetDate = new Date(goal.target_date);
    return targetDate.getMonth() === today.getMonth() && 
           targetDate.getFullYear() === today.getFullYear();
  }).length;

  const getTimeRemaining = (targetDate: string) => {
    const dueDate = parseISO(targetDate);
    const today = new Date();
    const daysRemaining = differenceInDays(dueDate, today);
    
    if (daysRemaining < 0) {
      return { text: "En retard", variant: "destructive" };
    } else if (daysRemaining === 0) {
      return { text: "Aujourd'hui", variant: "default" };
    } else if (daysRemaining <= 7) {
      return { text: `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`, variant: "warning" };
    } else {
      return { text: `${daysRemaining} jours`, variant: "outline" };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8" />
            Suivi d'objectifs
          </h1>
          <p className="text-muted-foreground">
            Définissez et suivez vos objectifs à court et long terme.
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
          <DialogContent>
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
                  placeholder="Perdre 5kg, Apprendre l'espagnol..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails sur votre objectif..."
                  rows={2}
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
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center">
                            {option.icon} <span className="ml-2">{option.label}</span>
                          </span>
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
                    <PopoverContent className="w-auto p-0" align="start">
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
              
              {editingGoal && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="progress">Progression</Label>
                    <span className="text-sm font-medium">{formData.progress}%</span>
                  </div>
                  <Slider
                    id="progress"
                    value={[formData.progress]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setFormData({ ...formData, progress: value[0] })}
                  />
                </div>
              )}
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

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid grid-cols-4 max-w-lg mx-auto">
          <TabsTrigger value="all">
            Tous ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            En cours ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="dueThisMonth">
            Ce mois-ci ({dueThisMonthCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Atteints ({completedCount})
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "all" ? "Tous les objectifs" :
               activeTab === "active" ? "Objectifs en cours" :
               activeTab === "dueThisMonth" ? "Objectifs de ce mois-ci" :
               "Objectifs atteints"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 rounded-md">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGoals.length > 0 ? (
              <div className="space-y-3">
                {filteredGoals.map((goal) => {
                  // Obtenir l'info sur le temps restant si une date cible est définie
                  const timeRemaining = goal.target_date ? getTimeRemaining(goal.target_date) : null;
                  
                  return (
                    <div 
                      key={goal.id} 
                      className={`p-4 border rounded-lg ${
                        goal.completed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                        : "border-muted bg-card"
                      }`}
                    >
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-medium text-lg flex items-center gap-2">
                              {goal.title}
                              {goal.completed && (
                                <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-300 border-none">
                                  Objectif atteint
                                </Badge>
                              )}
                            </h3>
                            
                            {goal.description && (
                              <p className="text-sm text-muted-foreground">
                                {goal.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {goal.category && <CategoryBadge category={goal.category} />}
                              
                              {goal.target_date && (
                                <Badge 
                                  variant={goal.completed ? "outline" : (timeRemaining?.variant as "default" | "destructive" | "outline")}
                                  className="flex items-center gap-1"
                                >
                                  <CalendarIcon2 className="h-3 w-3" />
                                  {format(parseISO(goal.target_date), "d MMMM yyyy", { locale: fr })}
                                  {!goal.completed && timeRemaining && (
                                    <span className="ml-1">({timeRemaining.text})</span>
                                  )}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(goal)}
                            >
                              <LineChart className="h-4 w-4" />
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
                                    Cette action ne peut pas être annulée. Cela supprimera définitivement cet objectif et toute votre progression.
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
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              Progression
                            </span>
                            <span className="font-medium">
                              {goal.progress}%
                            </span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                        
                        {!goal.completed && (
                          <div className="pt-2">
                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                              {[25, 50, 75, 100].map((progress) => (
                                <Button 
                                  key={progress}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  disabled={goal.progress === progress}
                                  onClick={() => updateGoalProgress(goal, progress)}
                                >
                                  {progress}%
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <GoalsEmptyState onCreate={() => setOpenDialog(true)} />
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Goals;
