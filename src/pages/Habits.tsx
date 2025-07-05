import { useState, useEffect } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAIActions } from "@/hooks/useAIActions";
import CreateModal from "@/components/modals/CreateModal";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
import AIActionConfirmation from "@/components/AIActionConfirmation";
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
} from "@/components/ui/alert-dialog"
import HabitList from "@/components/HabitList";
import { Habit } from "@/types";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();
  
  // Hook pour les actions IA
  const {
    pendingActions,
    showConfirmation,
    confirmActions,
    cancelActions
  } = useAIActions();

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

      setHabits(habitsWithCompletion);
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

  const toggleHabitCompletion = async (habitId: string, isCompleted: boolean) => {
    if (!user) return;

    try {
      if (isCompleted) {
        // Un-complete the habit
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
        // Complete the habit
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

  const archiveHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Habitude archivée !');
      fetchHabits();
    } catch (error) {
      console.error('Error archiving habit:', error);
      toast.error('Erreur lors de l\'archivage de l\'habitude');
    }
  };

  const unarchiveHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: false })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Habitude restaurée !');
      fetchHabits();
    } catch (error) {
      console.error('Error unarchiving habit:', error);
      toast.error('Erreur lors de la restauration de l\'habitude');
    }
  };

  const handleConfirmActions = async () => {
    await confirmActions();
    fetchHabits(); // Actualiser la liste après confirmation
  };

  const displayedHabits = showArchived 
    ? habits.filter(h => h.is_archived)
    : habits.filter(h => !h.is_archived);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Habitudes</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Voir actives' : 'Voir archivées'}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle habitude
          </Button>
        </div>
      </div>

      {/* Confirmation des actions IA */}
      {showConfirmation && (
        <AIActionConfirmation
          actions={pendingActions}
          onConfirm={handleConfirmActions}
          onCancel={cancelActions}
        />
      )}

      {isLoading ? (
        <div className="grid gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedHabits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {showArchived ? 'Aucune habitude archivée' : 'Aucune habitude'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {showArchived 
                ? 'Vous n\'avez pas d\'habitudes archivées.'
                : 'Commencez à créer de bonnes habitudes pour améliorer votre productivité.'
              }
            </p>
            {!showArchived && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première habitude
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <HabitList 
          habits={displayedHabits}
          loading={isLoading}
          onDelete={requestDelete}
          onEdit={handleEdit}
          onComplete={toggleHabitCompletion}
          onRefresh={fetchHabits}
          onArchive={archiveHabit}
          onUnarchive={unarchiveHabit}
          showArchived={showArchived}
        />
      )}

      {isCreateModalOpen && (
        <CreateModal 
          type="habit"
          onSuccess={handleCreateSuccess}
        />
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'habitude sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
