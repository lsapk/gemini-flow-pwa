
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarCheckIcon } from "@/components/icons/DeepFlowIcons";
import { Badge } from "@/components/ui/badge";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHabits, createHabit, updateHabit, deleteHabit } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Habit } from "@/types/models";

// Frequency options
const frequencyOptions = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" }
];

// Category options
const categoryOptions = [
  { value: "health", label: "Santé" },
  { value: "productivity", label: "Productivité" },
  { value: "learning", label: "Apprentissage" },
  { value: "finance", label: "Finance" },
  { value: "social", label: "Social" },
  { value: "other", label: "Autre" }
];

interface HabitFormData {
  title: string;
  description: string;
  frequency: string;
  target: number;
  category: string;
}

const HabitsEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <CalendarCheckIcon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
    <p className="text-muted-foreground mb-4">
      Commencez par créer votre première habitude pour améliorer votre quotidien.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle habitude
    </Button>
  </div>
);

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    title: "",
    description: "",
    frequency: "daily",
    target: 1,
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
      const { data } = await getHabits();
      
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
    
    if (!formData.title || !formData.frequency) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre et une fréquence pour votre habitude.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newHabit = {
        title: formData.title,
        description: formData.description,
        frequency: formData.frequency,
        target: formData.target,
        category: formData.category || undefined,
      };
      
      const { data } = await createHabit(newHabit);
      
      setHabits([data, ...habits]);
      
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
    
    if (!formData.title || !formData.frequency) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre et une fréquence pour votre habitude.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedHabit = {
        title: formData.title,
        description: formData.description,
        frequency: formData.frequency,
        target: formData.target,
        category: formData.category || undefined,
      };
      
      const { data } = await updateHabit(editingHabit.id, updatedHabit);
      
      setHabits(habits.map((habit) => 
        habit.id === editingHabit.id ? data : habit
      ));
      
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
      const { success } = await deleteHabit(id);
      
      if (success) {
        setHabits(habits.filter((habit) => habit.id !== id));
        
        toast({
          title: "Habitude supprimée",
          description: "Votre habitude a été supprimée avec succès.",
        });
      }
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
      const updates = {
        streak: habit.streak + 1,
        last_completed_at: new Date().toISOString(),
      };
      
      const { data } = await updateHabit(habit.id, updates);
      
      setHabits(habits.map((h) => (h.id === habit.id ? data : h)));
      
      toast({
        title: "Habitude complétée",
        description: `Votre habitude a été complétée. Série actuelle: ${data.streak}!`,
      });
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
      frequency: "daily",
      target: 1,
      category: "",
    });
    setEditingHabit(null);
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      description: habit.description || "",
      frequency: habit.frequency,
      target: habit.target,
      category: habit.category || "",
    });
    setOpenDialog(true);
  };

  const getCategoryLabel = (value: string | undefined) => {
    if (!value) return "";
    const category = categoryOptions.find((cat) => cat.value === value);
    return category ? category.label : value;
  };

  const getFrequencyLabel = (value: string) => {
    const frequency = frequencyOptions.find((freq) => freq.value === value);
    return frequency ? frequency.label : value;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheckIcon className="h-8 w-8" />
            Habitudes
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
                  : "Créez une nouvelle habitude que vous souhaitez suivre régulièrement."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'habitude..."
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
                <Label htmlFor="frequency">Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une fréquence" />
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
                <Label htmlFor="target">Objectif</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">
                  Nombre de fois que vous souhaitez accomplir cette habitude.
                </p>
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
              <Button onClick={editingHabit ? handleUpdateHabit : handleCreateHabit}>
                {editingHabit ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos habitudes</CardTitle>
          <CardDescription>
            Suivez et complétez vos habitudes régulièrement pour améliorer votre quotidien.
          </CardDescription>
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
          ) : habits.length > 0 ? (
            <div className="space-y-4">
              {habits.map((habit) => (
                <Card key={habit.id} className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">{habit.title}</h3>
                        {habit.description && (
                          <p className="text-sm text-muted-foreground">{habit.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{getFrequencyLabel(habit.frequency)}</Badge>
                          {habit.category && (
                            <Badge variant="outline">{getCategoryLabel(habit.category)}</Badge>
                          )}
                          <Badge variant="secondary">Série: {habit.streak}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteHabit(habit)}
                        >
                          Compléter
                        </Button>
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
                                Cette action ne peut pas être annulée. Cela supprimera définitivement cette habitude et son historique.
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <HabitsEmptyState onCreate={() => setOpenDialog(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Habits;
