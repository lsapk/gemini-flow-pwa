import { useState, useEffect } from "react";
import { Plus, Target, Archive, RotateCcw, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import HabitList from "@/components/HabitList";
import { Habit } from "@/types";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();

  const fetchHabits = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const targetDate = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitsWithCompletion = await Promise.all(
        (data || []).map(async (habit) => {
          const { data: completion } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('habit_id', habit.id)
            .eq('completed_date', targetDate)
            .maybeSingle();

          // Vérifier si l'habitude doit être faite pour la date sélectionnée
          const selectedDay = selectedDate.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
          const shouldShowForDate = !habit.days_of_week || habit.days_of_week.length === 0 || habit.days_of_week.includes(selectedDay);

          return {
            ...habit,
            frequency: habit.frequency as 'daily' | 'weekly' | 'monthly',
            is_completed_today: !!completion,
            should_show_today: shouldShowForDate
          };
        })
      );

      // Filtrer les habitudes actives pour ne montrer que celles qui doivent être faites pour la date sélectionnée
      const active = habitsWithCompletion.filter(h => !h.is_archived && h.should_show_today);
      const archived = habitsWithCompletion.filter(h => h.is_archived);
      
      setHabits(active.map(({ should_show_today, ...habit }) => habit as Habit));
      setArchivedHabits(archived.map(({ should_show_today, ...habit }) => habit as Habit));
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Erreur lors du chargement des habitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user, selectedDate]);

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsEditModalOpen(true);
  };

  const requestDelete = (habitId: string) => {
    setHabitToDelete(habitId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !habitToDelete) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Habitude supprimée !');
      fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Erreur lors de la suppression de l\'habitude');
    } finally {
      setIsDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };

  const toggleArchive = async (habitId: string, isArchived: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: !isArchived })
        .eq('id', habitId);

      if (error) throw error;

      toast.success(isArchived ? 'Habitude restaurée !' : 'Habitude archivée !');
      fetchHabits();
    } catch (error) {
      console.error('Error toggling archive:', error);
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const toggleHabitCompletion = async (habitId: string, isCompleted: boolean) => {
    if (!user) return;

    // Vérifier d'abord si l'habitude doit être faite pour la date sélectionnée
    const habit = habits.find(h => h.id === habitId) || archivedHabits.find(h => h.id === habitId);
    if (habit?.days_of_week && habit.days_of_week.length > 0) {
      const selectedDay = selectedDate.getDay();
      if (!habit.days_of_week.includes(selectedDay)) {
        toast.error("Cette habitude n'est pas prévue pour cette date");
        return;
      }
    }

    const targetDate = selectedDate.toISOString().split('T')[0];
    const isToday = targetDate === new Date().toISOString().split('T')[0];

    try {
      if (isCompleted) {
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .eq('completed_date', targetDate);

        if (deleteError) throw deleteError;
        
        // Ne mettre à jour le streak que si c'est aujourd'hui
        if (isToday) {
          const { data: currentHabit } = await supabase.from('habits').select('streak').eq('id', habitId).single();
          const newStreak = Math.max(0, (currentHabit?.streak || 0) - 1);
          
          await supabase.from('habits').update({ streak: newStreak }).eq('id', habitId);
        }
        
        toast.info("L'habitude n'est plus marquée comme faite.");
      } else {
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: targetDate
          });

        if (error) throw error;

        // Ne mettre à jour le streak et last_completed_at que si c'est aujourd'hui
        if (isToday) {
          const { data: currentHabit } = await supabase.from('habits').select('streak').eq('id', habitId).single();
          const newStreak = (currentHabit?.streak || 0) + 1;

          await supabase
            .from('habits')
            .update({
              last_completed_at: selectedDate.toISOString(),
              streak: newStreak
            })
            .eq('id', habitId);
        }

        toast.success('Habitude complétée !');
      }
      
      // Recharger les habitudes pour la date sélectionnée
      await fetchHabits();
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast.error("Erreur lors de la mise à jour de l'habitude");
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchHabits();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingHabit(null);
    fetchHabits();
  };

  const currentHabits = activeTab === "active" ? habits : archivedHabits;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="space-y-3 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight">Habitudes</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-xs sm:text-sm flex-1 sm:flex-initial",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={fr}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="text-sm">
                <Plus className="h-4 w-4 mr-1" />
                <span className="sm:hidden">Nouvelle</span>
                <span className="hidden sm:inline">Nouvelle habitude</span>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 md:h-9">
              <TabsTrigger value="active" className="flex items-center gap-1 text-xs md:text-sm py-1">
                <Target className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Actives</span>
                <span className="xs:hidden">Act.</span>
                <span className="ml-1">({habits.length})</span>
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-1 text-xs md:text-sm py-1">
                <Archive className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Archivées</span>
                <span className="xs:hidden">Arch.</span>
                <span className="ml-1">({archivedHabits.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-3 md:mt-4">
              {isLoading ? (
                <div className="grid gap-2 md:gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-3 md:p-6">
                        <div className="h-4 md:h-6 bg-muted rounded mb-2 md:mb-4"></div>
                        <div className="h-3 md:h-4 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : currentHabits.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-6 md:py-12">
                    {activeTab === "active" ? (
                      <>
                        <Target className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold mb-2">Aucune habitude active</h3>
                        <p className="text-muted-foreground text-center mb-3 md:mb-4 px-4 text-sm md:text-base">
                          Commencez à créer de bonnes habitudes pour améliorer votre productivité.
                        </p>
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Créer votre première habitude
                        </Button>
                      </>
                    ) : (
                      <>
                        <Archive className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold mb-2">Aucune habitude archivée</h3>
                        <p className="text-muted-foreground text-center px-4 text-sm md:text-base">
                          Les habitudes que vous archivez apparaîtront ici.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <HabitList 
                  habits={currentHabits}
                  loading={isLoading}
                  onDelete={requestDelete}
                  onEdit={handleEdit}
                  onComplete={toggleHabitCompletion}
                  onRefresh={fetchHabits}
                  onArchive={toggleArchive}
                  showArchived={activeTab === "archived"}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

      {isCreateModalOpen && (
        <CreateModal 
          type="habit"
          onSuccess={handleCreateSuccess}
        />
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'habitude</DialogTitle>
          </DialogHeader>
          <CreateHabitForm 
            onSuccess={handleEditSuccess}
            habit={editingHabit}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'habitude sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
