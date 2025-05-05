
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TargetIcon } from "@/components/icons/DeepFlowIcons";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Flag, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Goal } from "@/types/models";

// Category options
const categoryOptions = [
  { value: "personal", label: "Personnel" },
  { value: "career", label: "Carrière" },
  { value: "health", label: "Santé" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Éducation" },
  { value: "other", label: "Autre" }
];

interface GoalFormData {
  title: string;
  description: string;
  target_date: Date | undefined;
  category: string;
}

const GoalsEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <TargetIcon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucun objectif</h3>
    <p className="text-muted-foreground mb-4">
      Commencez par définir votre premier objectif pour avancer vers vos ambitions.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvel objectif
    </Button>
  </div>
);

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    target_date: undefined,
    category: "",
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
      const { data } = await getGoals();
      
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
        target_date: formData.target_date ? formData.target_date.toISOString() : undefined,
        category: formData.category || undefined,
      };
      
      const { data } = await createGoal(newGoal);
      
      setGoals([data, ...goals]);
      
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
        target_date: formData.target_date ? formData.target_date.toISOString() : null,
        category: formData.category || null,
      };
      
      const { data } = await updateGoal(editingGoal.id, updatedGoal);
      
      setGoals(goals.map((goal) => (goal.id === editingGoal.id ? data : goal)));
      
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
      const { success } = await deleteGoal(id);
      
      if (success) {
        setGoals(goals.filter((goal) => goal.id !== id));
        
        toast({
          title: "Objectif supprimé",
          description: "Votre objectif a été supprimé avec succès.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'objectif.",
        variant: "destructive",
      });
      console.error("Error deleting goal:", error);
    }
  };

  const handleToggleComplete = async (goal: Goal) => {
    try {
      const updates = {
        completed: !goal.completed,
        progress: !goal.completed ? 100 : 0,
      };
      
      const { data } = await updateGoal(goal.id, updates);
      
      setGoals(goals.map((g) => (g.id === goal.id ? data : g)));
      
      toast({
        title: goal.completed ? "Objectif réactivé" : "Objectif complété",
        description: goal.completed
          ? "Votre objectif a été marqué comme en cours."
          : "Félicitations ! Votre objectif a été marqué comme complété.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'objectif.",
        variant: "destructive",
      });
      console.error("Error updating goal completion:", error);
    }
  };

  const handleUpdateProgress = async (goal: Goal, progress: number) => {
    try {
      const updates = {
        progress: progress,
        completed: progress === 100,
      };
      
      const { data } = await updateGoal(goal.id, updates);
      
      setGoals(goals.map((g) => (g.id === goal.id ? data : g)));
      
      if (progress === 100) {
        toast({
          title: "Objectif complété",
          description: "Félicitations ! Votre objectif a été complété à 100%.",
        });
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
      target_date: undefined,
      category: "",
    });
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_date: goal.target_date ? parseISO(goal.target_date) : undefined,
      category: goal.category || "",
    });
    setOpenDialog(true);
  };

  const getCategoryLabel = (value: string | undefined) => {
    if (!value) return "";
    const category = categoryOptions.find((cat) => cat.value === value);
    return category ? category.label : value;
  };

  const filteredGoals = goals.filter((goal) => {
    if (activeTab === "active") return !goal.completed;
    if (activeTab === "completed") return goal.completed;
    return true;
  });

  const getProgressBackgroundColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TargetIcon className="h-8 w-8" />
            Objectifs
          </h1>
          <p className="text-muted-foreground">
            Définissez et suivez vos objectifs personnels et professionnels.
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
                  : "Créez un nouvel objectif que vous souhaitez atteindre."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'objectif..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description (optionnel)..."
                  rows={3}
                />
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
                        <span>Choisir une date (optionnel)</span>
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
              
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      <Card>
        <CardHeader>
          <CardTitle>Vos objectifs</CardTitle>
          <CardDescription>
            Suivez votre progression et atteignez vos ambitions.
          </CardDescription>
          <Tabs 
            defaultValue="all" 
            className="mt-4"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "all" | "active" | "completed")}
          >
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="active">En cours</TabsTrigger>
              <TabsTrigger value="completed">Complétés</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-md">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGoals.length > 0 ? (
            <div className="space-y-4">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className={`bg-card/50 ${goal.completed ? 'border-green-500/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={goal.completed}
                          onCheckedChange={() => handleToggleComplete(goal)}
                          className="h-5 w-5"
                        />
                        <h3 className={`text-lg font-medium ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {goal.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
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
                    
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Progression: {goal.progress}%</span>
                        <div className="flex items-center gap-2">
                          {[0, 25, 50, 75, 100].map((progressValue) => (
                            <Button
                              key={progressValue}
                              variant="outline"
                              size="sm"
                              className={`h-7 w-7 p-0 ${goal.progress === progressValue ? 'bg-primary text-primary-foreground' : ''}`}
                              onClick={() => handleUpdateProgress(goal, progressValue)}
                            >
                              {progressValue}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getProgressBackgroundColor(goal.progress)}`} 
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      {goal.category && (
                        <Badge variant="outline">{getCategoryLabel(goal.category)}</Badge>
                      )}
                      
                      {goal.target_date && (
                        <Badge 
                          variant="outline"
                          className={`flex items-center gap-1 ${
                            isPast(parseISO(goal.target_date)) && !isToday(parseISO(goal.target_date)) && !goal.completed 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : ''
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {format(parseISO(goal.target_date), "dd/MM/yyyy", { locale: fr })}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <GoalsEmptyState onCreate={() => setOpenDialog(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;
