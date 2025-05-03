
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isSameDay, parseISO, isThisWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { PlusCircle, CheckCircle, Flame, Pencil, Trash2, Zap, Award } from "lucide-react";
import { CalendarCheckIcon } from "@/components/icons/DeepFlowIcons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getHabits, addHabit, updateHabit, deleteHabit } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Habit frequencies and categories
const habitFrequencies = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" }
];

const habitCategories = [
  { value: "health", label: "Santé" },
  { value: "productivity", label: "Productivité" },
  { value: "learning", label: "Apprentissage" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Autre" }
];

interface Habit {
  id: string;
  title: string;
  description?: string;
  category?: string;
  frequency: string;
  target: number;
  streak?: number;
  last_completed_at?: string;
  user_id: string;
}

interface HabitFormData {
  title: string;
  description: string;
  category: string;
  frequency: string;
  target: number;
}

const HabitEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mx-auto rounded-full bg-primary/10 p-4">
      <CalendarCheckIcon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="mt-4 text-lg font-medium">Aucune habitude</h3>
    <p className="mb-4 mt-2 text-sm text-muted-foreground">
      Commencez par créer votre première habitude pour suivre votre progression.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle habitude
    </Button>
  </Card>
);

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    title: "",
    description: "",
    category: "",
    frequency: "daily",
    target: 1
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
        category: formData.category || null,
        frequency: formData.frequency,
        target: formData.target,
        streak: 0,
        user_id: user.id
      };
      
      const { data, error } = await addHabit(newHabit);
      
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
        category: formData.category || null,
        frequency: formData.frequency,
        target: formData.target
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

  const handleCompleteHabit = async (habit: Habit) => {
    try {
      // Logic to check if already completed today
      const isAlreadyCompletedToday = 
        habit.last_completed_at && isToday(parseISO(habit.last_completed_at));
      
      if (isAlreadyCompletedToday) {
        toast({
          title: "Déjà complété",
          description: "Vous avez déjà complété cette habitude aujourd'hui.",
        });
        return;
      }
      
      // Calculate new streak value
      let newStreak = (habit.streak || 0) + 1;
      
      // Check for streak continuity
      const lastCompletedDate = habit.last_completed_at 
        ? parseISO(habit.last_completed_at)
        : null;
        
      // If there was a previous completion, check for continuity
      if (lastCompletedDate) {
        const yesterday = addDays(new Date(), -1);
        const isYesterday = isSameDay(lastCompletedDate, yesterday);
        
        // For daily habits, streak is broken if not completed yesterday
        // For weekly, we just check if completion was in the current week
        if (habit.frequency === 'daily' && !isYesterday) {
          newStreak = 1; // Reset streak if chain broken
        } else if (habit.frequency === 'weekly' && !isThisWeek(lastCompletedDate)) {
          newStreak = 1; // Reset streak
        }
      }
      
      const { data, error } = await updateHabit(habit.id, {
        last_completed_at: new Date().toISOString(),
        streak: newStreak,
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setHabits(habits.map((h) => (h.id === habit.id ? data : h)));
        
        toast({
          title: "Habitude complétée!",
          description: `Série actuelle: ${newStreak} ${
            habit.frequency === 'daily' ? 'jour' : 
            habit.frequency === 'weekly' ? 'semaine' : 'mois'
          }${newStreak > 1 ? 's' : ''}!`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de compléter l'habitude.",
        variant: "destructive",
      });
      console.error("Error completing habit:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      frequency: "daily",
      target: 1,
    });
    setEditingHabit(null);
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      description: habit.description || "",
      category: habit.category || "",
      frequency: habit.frequency,
      target: habit.target,
    });
    setOpenDialog(true);
  };

  // Group habits by frequency
  const groupedHabits = habits.reduce((acc, habit) => {
    const frequency = habit.frequency || "daily";
    if (!acc[frequency]) {
      acc[frequency] = [];
    }
    acc[frequency].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  const canCompleteToday = (habit: Habit) => {
    if (!habit.last_completed_at) return true;
    
    const lastCompleted = parseISO(habit.last_completed_at);
    
    if (habit.frequency === 'daily') {
      return !isToday(lastCompleted);
    } else if (habit.frequency === 'weekly') {
      return !isThisWeek(lastCompleted);
    } else {
      // Monthly check would be more complex, simplified here
      return !isToday(lastCompleted);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheckIcon className="h-8 w-8" />
            Suivi d'habitudes
          </h1>
          <p className="text-muted-foreground">
            Créez et suivez vos habitudes quotidiennes pour atteindre vos objectifs.
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingHabit ? "Modifier l'habitude" : "Nouvelle habitude"}</DialogTitle>
              <DialogDescription>
                {editingHabit
                  ? "Modifiez les détails de votre habitude."
                  : "Créez une nouvelle habitude pour suivre votre progression."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Méditer 10 minutes"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre habitude..."
                  rows={3}
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
                      <SelectValue placeholder="Fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      {habitFrequencies.map((frequency) => (
                        <SelectItem key={frequency.value} value={frequency.value}>
                          {frequency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {habitCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target">Objectif (nombre de fois)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="target"
                    type="number"
                    min={1}
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    par {formData.frequency === "daily" ? "jour" : formData.frequency === "weekly" ? "semaine" : "mois"}
                  </span>
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
              <Button onClick={editingHabit ? handleUpdateHabit : handleCreateHabit}>
                {editingHabit ? "Mettre à jour" : "Créer"}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <HabitEmptyState onCreate={() => setOpenDialog(true)} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHabits).map(([frequency, frequencyHabits]) => (
            <div key={frequency} className="space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold">
                  {habitFrequencies.find(f => f.value === frequency)?.label || "Autre"}
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {frequencyHabits.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frequencyHabits.map((habit) => (
                  <Card key={habit.id} className="glass-card transition-all duration-300 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {habit.title}
                            {habit.streak && habit.streak > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1.5 text-amber-500 border-amber-200 dark:border-amber-800">
                                <Flame className="h-3.5 w-3.5" />
                                {habit.streak}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5">
                            {habit.category && (
                              <>
                                <span className="capitalize">{habit.category}</span>
                                <span className="text-muted-foreground">•</span>
                              </>
                            )}
                            <span>
                              {habit.target > 1
                                ? `${habit.target} fois ${frequency === "daily" ? "par jour" : frequency === "weekly" ? "par semaine" : "par mois"}`
                                : `${frequency === "daily" ? "Chaque jour" : frequency === "weekly" ? "Chaque semaine" : "Chaque mois"}`}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(habit)}
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
                                  Cette action ne peut pas être annulée. Cela supprimera définitivement votre habitude.
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
                    </CardHeader>
                    
                    <CardContent className="text-sm">
                      {habit.description && (
                        <p className="mb-4 text-muted-foreground">{habit.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {habit.last_completed_at && (
                            <span className="text-xs text-muted-foreground">
                              Dernière fois: {format(parseISO(habit.last_completed_at), "PP", { locale: fr })}
                            </span>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          disabled={!canCompleteToday(habit)}
                          variant={canCompleteToday(habit) ? "default" : "outline"}
                          onClick={() => handleCompleteHabit(habit)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {canCompleteToday(habit) ? "Compléter" : "Déjà complété"}
                        </Button>
                      </div>
                    </CardContent>
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

export default Habits;
