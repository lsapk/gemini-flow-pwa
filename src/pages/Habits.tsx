import { useState, useEffect } from "react";
import { Plus, Target, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
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
  const { user } = useAuth();

  const fetchHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitsWithCompletion = await Promise.all(
        (data || []).map(async (habit) => {
          const today = new Date().toISOString().split('T')[0];
          const { data: completion } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('habit_id', habit.id)
            .eq('completed_date', today)
            .maybeSingle();

          return {
            ...habit,
            frequency: habit.frequency as 'daily' | 'weekly' | 'monthly',
            is_completed_today: !!completion
          } as Habit;
        })
      );

      const active = habitsWithCompletion.filter(h => !h.is_archived);
      const archived = habitsWithCompletion.filter(h => h.is_archived);
      
      setHabits(active);
      setArchivedHabits(archived);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Erreur lors du chargement des habitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

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

    try {
      if (isCompleted) {
        const today = new Date().toISOString().split('T')[0];
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .eq('completed_date', today);

        if (deleteError) throw deleteError;
        
        const { data: currentHabit } = await supabase.from('habits').select('streak').eq('id', habitId).single();
        const newStreak = Math.max(0, (currentHabit?.streak || 0) - 1);
        
        await supabase.from('habits').update({ streak: newStreak }).eq('id', habitId);
        
        toast.info("L'habitude n'est plus marquée comme faite.");
      } else {
        const today = new Date().toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: today
          });

        if (error) throw error;

        const { data: currentHabit } = await supabase.from('habits').select('streak').eq('id', habitId).single();
        const newStreak = (currentHabit?.streak || 0) + 1;

        await supabase
          .from('habits')
          .update({
            last_completed_at: new Date().toISOString(),
            streak: newStreak
          })
          .eq('id', habitId);

        toast.success('Habitude complétée !');
      }
      fetchHabits();
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
    <div className="space-y-6">
      <div className="pt-14 md:pt-6 px-3 md:px-6">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight">Habitudes</h1>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4 mr-1" />
              <span className="sm:hidden">Nouvelle</span>
              <span className="hidden sm:inline">Nouvelle habitude</span>
            </Button>
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
