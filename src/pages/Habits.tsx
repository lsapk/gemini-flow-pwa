import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Edit, PlusCircle, Repeat, Target, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Habit, ApiResponse, ApiSuccessResponse } from "@/types/models";
import { getHabits, createHabit, updateHabit, deleteHabit } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface HabitFormData {
  title: string;
  description?: string;
  frequency: string;
  target: number;
  category?: string;
}

const HabitEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <Repeat className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
    <p className="text-muted-foreground mb-4">
      Commencez à suivre vos habitudes pour améliorer votre quotidien.
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
      const response = await getHabits() as ApiResponse<Habit[]>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setHabits(response.data || []);
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
        description: "Veuillez remplir tous les champs obligatoires.",
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
        category: formData.category,
        user_id: user.id,
      };
      
      const response = await createHabit(newHabit) as ApiResponse<Habit>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setHabits([response.data, ...habits]);
      
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
        description: "Veuillez remplir tous les champs obligatoires.",
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
        category: formData.category,
      };
      
      const response = await updateHabit(editingHabit.id, updatedHabit) as ApiResponse<Habit>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setHabits(habits.map((habit) => (habit.id === editingHabit.id ? response.data : habit)));
      
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
      const response = await deleteHabit(id) as ApiSuccessResponse;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.success) {
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
      const updateData = {
        last_completed_at: new Date().toISOString(),
        streak: habit.streak + 1,
      };
      
      const response = await updateHabit(habit.id, updateData) as ApiResponse<Habit>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setHabits(habits.map((h) => (h.id === habit.id ? response.data : h)));
      
      toast({
        title: "Habitude complétée",
        description: `Vous avez maintenant une série de ${response.data.streak} pour cette habitude.`,
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
      description: habit.description,
      frequency: habit.frequency,
      target: habit.target,
      category: habit.category,
    });
    setOpenDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="h-8 w-8" />
            Habitudes
          </h1>
          <p className="text-muted-foreground">
            Suivez vos habitudes pour améliorer votre quotidien.
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
                  placeholder="Titre de l'habitude..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'habitude..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target">Objectif</Label>
                <Input
                  id="target"
                  type="number"
                  value={formData.target.toString()}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
                  placeholder="Nombre de fois par jour/semaine/mois..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Catégorie (facultatif)..."
                />
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
            Suivez vos habitudes pour améliorer votre quotidien.
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
                <Card key={habit.id} className="glass-card">
                  <CardHeader>
                    <CardTitle>{habit.title}</CardTitle>
                    <CardDescription>
                      {habit.description || "Aucune description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Fréquence: {habit.frequency}, Objectif: {habit.target}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Série actuelle: {habit.streak}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCompleteHabit(habit)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(habit)}
                        >
                          <Edit className="h-4 w-4" />
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
                                Cette action ne peut pas être annulée. Cela supprimera définitivement cette habitude.
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
            <HabitEmptyState onCreate={() => setOpenDialog(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Habits;
