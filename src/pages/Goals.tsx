
import { useState, useEffect } from "react";
import { Plus, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import CreateGoalForm from "@/components/modals/CreateGoalForm";
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
import GoalList from "@/components/GoalList";
import { Goal } from "@/types";
import { useGoalDragAndDrop } from "@/hooks/useGoalDragAndDrop";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const { user } = useAuth();

  // Hook pour le glisser-déposer
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useGoalDragAndDrop(
    goals,
    async (reorderedGoals) => {
      setGoals(reorderedGoals);
      
      try {
        const updates = reorderedGoals.map((goal, index) => ({
          id: goal.id,
          sort_order: index
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from('goals')
            .update({ sort_order: update.sort_order } as any)
            .eq('id', update.id);
          
          if (error) throw error;
        }

        toast.success('Ordre des objectifs mis à jour !');
      } catch (error) {
        console.error('Erreur lors du réordonnancement:', error);
        toast.error('Erreur lors de la mise à jour de l\'ordre');
        fetchGoals();
      }
    }
  );

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Erreur lors du chargement des objectifs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  };

  const requestDelete = (goalId: string) => {
    setGoalToDelete(goalId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !goalToDelete) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Objectif supprimé !');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erreur lors de la suppression de l\'objectif');
    } finally {
      setIsDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchGoals();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingGoal(null);
    fetchGoals();
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Objectifs</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            En cours ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Terminés ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <GoalList 
            goals={goals}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={requestDelete}
            showCompleted={false}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        </TabsContent>

        <TabsContent value="completed">
          <GoalList 
            goals={goals}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={requestDelete}
            showCompleted={true}
          />
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <CreateModal 
          type="goal"
          onSuccess={handleCreateSuccess}
        />
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'objectif</DialogTitle>
          </DialogHeader>
          <CreateGoalForm 
            onSuccess={handleEditSuccess}
            goal={editingGoal}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'objectif sera définitivement supprimé.
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
