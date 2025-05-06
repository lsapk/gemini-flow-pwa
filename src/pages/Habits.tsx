
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
import { format, isPast, isToday, parseISO, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Repeat, PlusCircle, Trash2, Calendar as CalendarIcon2, CalendarCheck, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getHabits, createHabit, updateHabit, deleteHabit } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Fréquences des habitudes
const frequencyOptions = [
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" }
];

// Catégories des habitudes
const categoryOptions = [
  { value: "health", label: "Santé", icon: "🏥" },
  { value: "fitness", label: "Sport", icon: "🏋️" },
  { value: "learning", label: "Apprentissage", icon: "📚" },
  { value: "productivity", label: "Productivité", icon: "⚡" },
  { value: "mindfulness", label: "Bien-être", icon: "🧘" },
  { value: "social", label: "Social", icon: "👥" },
  { value: "other", label: "Autre", icon: "🔍" }
];

interface Habit {
  id: string;
  title: string;
  description?: string;
  streak: number;
  target: number;
  frequency: string;
  category?: string;
  last_completed_at?: string;
  user_id: string;
  created_at: string;
}

interface HabitFormData {
  title: string;
  description: string;
  target: number;
  frequency: string;
  category: string;
}

const HabitsEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <Repeat className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
    <p className="text-muted-foreground mb-4">
      Commencez par créer votre première habitude pour développer une routine positive.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle habitude
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

const FrequencyBadge = ({ frequency }: { frequency: string }) => {
  const frequencyOption = frequencyOptions.find((option) => option.value === frequency);
  
  return (
    <Badge variant="outline" className="bg-secondary/10 text-secondary">
      <Repeat className="h-3 w-3 mr-1" />
      {frequencyOption?.label || ""}
    </Badge>
  );
};

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    title: "",
    description: "",
    target: 1,
    frequency: "daily",
    category: "",
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await getHabits();
      
      if (error) throw new Error(error.message);
      
      setHabits(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos habitudes.",
        variant: "destructive",
      });
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async () => {
    if (!user) return;
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre pour votre habitude.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newHabit = {
        title: formData.title,
        description: formData.description,
        streak: 0,
        target: Number(formData.target) || 1,
        frequency: formData.frequency || "daily",
        category: formData.category || null,
        user_id: user.id,
      };
      
      const { data, error } = await createHabit(newHabit);
      
      if (error) throw new Error(error.message);
      
      setHabits([...(data ? [data] : []), ...habits]);
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Habitude créée",
        description: "Votre nouvelle habitude a été créée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'habitude.",
        variant: "destructive",
      });
      console.error("Error creating habit:", error);
    }
  };

  const handleUpdateHabit = async () => {
    if (!user || !editingHabit) return;
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre pour votre habitude.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedHabit = {
        title: formData.title,
        description: formData.description,
        target: Number(formData.target) || 1,
        frequency: formData.frequency || "daily",
        category: formData.category || null,
      };
      
      const { data, error } = await updateHabit(editingHabit.id, updatedHabit);
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setHabits(habits.map((habit) => (habit.id === editingHabit.id ? data : habit)));
      }
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Habitude mise à jour",
        description: "Votre habitude a été mise à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'habitude.",
        variant: "destructive",
      });
      console.error("Error updating habit:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      const { error } = await deleteHabit(id);
      
      if (error) throw new Error(error.message);
      
      setHabits(habits.filter((habit) => habit.id !== id));
      
      toast({
        title: "Habitude supprimée",
        description: "Votre habitude a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'habitude.",
        variant: "destructive",
      });
      console.error("Error deleting habit:", error);
    }
  };

  const completeHabit = async (habit: Habit) => {
    try {
      let updatedStreak = habit.streak;
      const now = new Date();

      // Vérifier si l'habitude a déjà été complétée aujourd'hui
      if (habit.last_completed_at) {
        const lastCompletedDate = new Date(habit.last_completed_at);
        
        if (isToday(lastCompletedDate)) {
          toast({
            title: "Déjà complétée",
            description: "Vous avez déjà complété cette habitude aujourd'hui.",
            variant: "default",
          });
          return;
        }
      }

      // Augmenter le streak si la dernière complétion est conforme à la fréquence
      updatedStreak = habit.streak + 1;
      
      const { data, error } = await updateHabit(habit.id, {
        streak: updatedStreak,
        last_completed_at: now.toISOString()
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setHabits(habits.map((h) => (h.id === habit.id ? data : h)));
        
        toast({
          title: "Habitude complétée",
          description: `Bravo ! Vous avez maintenu cette habitude pendant ${updatedStreak} jours.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'habitude comme complétée.",
        variant: "destructive",
      });
      console.error("Error completing habit:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target: 1,
      frequency: "daily",
      category: "",
    });
    setEditingHabit(null);
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      description: habit.description || "",
      target: habit.target,
      frequency: habit.frequency,
      category: habit.category || "",
    });
    setOpenDialog(true);
  };

  // Filtrer les habitudes en fonction de l'onglet actif
  const filteredHabits = habits.filter((habit) => {
    if (activeTab === "all") return true;
    if (activeTab === "daily") return habit.frequency === "daily";
    if (activeTab === "weekly") return habit.frequency === "weekly";
    if (activeTab === "monthly") return habit.frequency === "monthly";
    return true;
  });
  
  // Compter les habitudes par fréquence
  const dailyCount = habits.filter((habit) => habit.frequency === "daily").length;
  const weeklyCount = habits.filter((habit) => habit.frequency === "weekly").length;
  const monthlyCount = habits.filter((habit) => habit.frequency === "monthly").length;

  // Calculer si une habitude est due aujourd'hui
  const isHabitDueToday = (habit: Habit) => {
    if (!habit.last_completed_at) return true;
    
    const lastCompleted = new Date(habit.last_completed_at);
    const today = new Date();
    
    switch (habit.frequency) {
      case 'daily':
        return !isToday(lastCompleted);
      case 'weekly':
        // Vérifier si la dernière complétion est vieille d'une semaine
        return addDays(lastCompleted, 7) <= today;
      case 'monthly':
        // Vérifier si la dernière complétion est vieille d'un mois
        const lastMonth = lastCompleted.getMonth();
        const currentMonth = today.getMonth();
        const lastYear = lastCompleted.getFullYear();
        const currentYear = today.getFullYear();
        
        return (currentYear > lastYear) || (currentYear === lastYear && currentMonth > lastMonth);
      default:
        return true;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="h-8 w-8" />
            Suivi d'habitudes
          </h1>
          <p className="text-muted-foreground">
            Suivez vos habitudes quotidiennes, hebdomadaires et mensuelles.
          </p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle habitude
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHabit ? "Modifier l'habitude" : "Nouvelle habitude"}</DialogTitle>
              <DialogDescription>
                {editingHabit
                  ? "Modifiez les détails de votre habitude."
                  : "Créez une nouvelle habitude pour développer une routine positive."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Méditer, lire, faire du sport..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails sur cette habitude..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target">Objectif (jours)</Label>
                  <Input
                    id="target"
                    type="number"
                    min={1}
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
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
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm();
                setOpenDialog(false);
              }}>
                Annuler
              </Button>
              <Button onClick={editingHabit ? handleUpdateHabit : handleCreateHabit}>
                {editingHabit ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid grid-cols-4 max-w-lg mx-auto">
          <TabsTrigger value="all">
            Toutes ({habits.length})
          </TabsTrigger>
          <TabsTrigger value="daily">
            Quotidiennes ({dailyCount})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Hebdomadaires ({weeklyCount})
          </TabsTrigger>
          <TabsTrigger value="monthly">
            Mensuelles ({monthlyCount})
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "all" ? "Toutes les habitudes" :
               activeTab === "daily" ? "Habitudes quotidiennes" :
               activeTab === "weekly" ? "Habitudes hebdomadaires" :
               "Habitudes mensuelles"}
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
            ) : filteredHabits.length > 0 ? (
              <div className="space-y-3">
                {filteredHabits.map((habit) => {
                  // Calculer le pourcentage de progression
                  const progressPercentage = Math.min(100, (habit.streak / habit.target) * 100);
                  const isDueToday = isHabitDueToday(habit);
                  
                  return (
                    <div 
                      key={habit.id} 
                      className={`p-4 border rounded-lg ${
                        isDueToday ? "border-primary/30 bg-primary/5" : "border-muted bg-card"
                      }`}
                    >
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-medium text-lg flex items-center gap-2">
                              {habit.title}
                              {isDueToday && <Badge variant="default" className="bg-primary/20 text-primary border-none">À faire aujourd'hui</Badge>}
                            </h3>
                            
                            {habit.description && (
                              <p className="text-sm text-muted-foreground">
                                {habit.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <FrequencyBadge frequency={habit.frequency} />
                              {habit.category && <CategoryBadge category={habit.category} />}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(habit)}
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
                                    Cette action ne peut pas être annulée. Cela supprimera définitivement cette habitude et tout votre historique associé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteHabit(habit.id)}
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
                              Progression: {habit.streak} / {habit.target} jours
                            </span>
                            <span className="font-medium">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <div className="text-sm text-muted-foreground">
                            {habit.last_completed_at ? (
                              <span className="flex items-center gap-1">
                                <CalendarCheck className="h-4 w-4" />
                                Dernière fois: {format(parseISO(habit.last_completed_at), "d MMMM yyyy", { locale: fr })}
                              </span>
                            ) : (
                              <span>Pas encore complété</span>
                            )}
                          </div>
                          
                          <Button 
                            variant={isDueToday ? "default" : "outline"}
                            size="sm"
                            onClick={() => completeHabit(habit)}
                            disabled={!isDueToday}
                          >
                            {isDueToday ? "Marquer comme fait" : "Déjà complété"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <HabitsEmptyState onCreate={() => setOpenDialog(true)} />
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Habits;
