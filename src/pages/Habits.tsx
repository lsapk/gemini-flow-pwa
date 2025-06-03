
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Habit } from "@/types";
import { getHabits, createHabit, updateHabit, deleteHabit } from "@/lib/api";
import { PlusCircle, Repeat, Calendar, Flame, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState(1);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    try {
      const habitData = {
        title: title.trim(),
        description: description.trim() || null,
        frequency,
        category: category || null,
        target,
        user_id: user.id,
        streak: editingHabit?.streak || 0,
      };

      if (editingHabit) {
        const { error } = await updateHabit(editingHabit.id, habitData);
        if (error) throw error;
        
        toast({
          title: "Habitude modifiée",
          description: "Votre habitude a été modifiée avec succès.",
        });
      } else {
        const { error } = await createHabit(habitData);
        if (error) throw error;
        
        toast({
          title: "Habitude créée",
          description: "Votre habitude a été créée avec succès.",
        });
      }
      
      resetForm();
      fetchHabits();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'habitude.",
        variant: "destructive",
      });
      console.error("Error saving habit:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteHabit(id);
      if (error) throw error;
      
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

  const markAsCompleted = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const newStreak = (habit.streak || 0) + 1;
      const { error } = await updateHabit(habitId, {
        ...habit,
        streak: newStreak,
        last_completed_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      fetchHabits();
      toast({
        title: "Habitude complétée !",
        description: `Série de ${newStreak} jour${newStreak > 1 ? 's' : ''} !`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'habitude comme complétée.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFrequency('daily');
    setCategory("");
    setTarget(1);
    setEditingHabit(null);
    setIsFormOpen(false);
  };

  const editHabit = (habit: Habit) => {
    setTitle(habit.title);
    setDescription(habit.description || "");
    setFrequency(habit.frequency);
    setCategory(habit.category || "");
    setTarget(habit.target);
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const filteredHabits = activeTab === "all" ? habits : habits.filter(h => h.frequency === activeTab);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Habitudes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Développez de bonnes habitudes pour améliorer votre quotidien
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nouvelle habitude
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-0 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingHabit ? "Modifier l'habitude" : "Nouvelle habitude"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nom de votre habitude"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description de votre habitude (optionnel)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence *</Label>
                <Select value={frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Santé</SelectItem>
                    <SelectItem value="fitness">Sport</SelectItem>
                    <SelectItem value="learning">Apprentissage</SelectItem>
                    <SelectItem value="productivity">Productivité</SelectItem>
                    <SelectItem value="mindfulness">Bien-être</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target">Objectif</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
                  placeholder="Nombre de fois"
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingHabit ? "Modifier" : "Créer"}
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
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{habits.length}</p>
              </div>
              <Repeat className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-600">Séries actives</p>
                <p className="text-xl sm:text-2xl font-bold text-red-900">
                  {habits.filter(h => (h.streak || 0) > 0).length}
                </p>
              </div>
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Quotidiennes</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  {habits.filter(h => h.frequency === 'daily').length}
                </p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Meilleure série</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">
                  {Math.max(...habits.map(h => h.streak || 0), 0)}
                </p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl">🏆</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frequency Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toutes ({habits.length})</TabsTrigger>
          <TabsTrigger value="daily">Quotidiennes ({habits.filter(h => h.frequency === 'daily').length})</TabsTrigger>
          <TabsTrigger value="weekly">Hebdo ({habits.filter(h => h.frequency === 'weekly').length})</TabsTrigger>
          <TabsTrigger value="monthly">Mensuelles ({habits.filter(h => h.frequency === 'monthly').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos habitudes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredHabits.length === 0 ? (
                <div className="text-center py-8">
                  <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre première habitude
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer une habitude
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHabits.map((habit) => (
                    <div key={habit.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{habit.title}</h3>
                            {(habit.streak || 0) > 0 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {habit.streak}
                              </Badge>
                            )}
                          </div>
                          {habit.description && (
                            <p className="text-sm text-muted-foreground mb-2">{habit.description}</p>
                          )}
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline">{habit.frequency}</Badge>
                            {habit.category && <Badge variant="secondary">{habit.category}</Badge>}
                            <Badge variant="outline">Cible: {habit.target}</Badge>
                          </div>
                          {habit.last_completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Dernière fois: {format(new Date(habit.last_completed_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editHabit(habit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(habit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => markAsCompleted(habit.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Marquer comme fait
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
