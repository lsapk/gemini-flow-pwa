import { useState, useEffect } from "react";
import { Plus, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import CreateGoalForm from "@/components/modals/CreateGoalForm";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
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
import { GoalList } from "@/components/GoalList";
import { Goal } from "@/types";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ongoing");
  const { user } = useAuth();

  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length) : 0;

  const fetchGoals = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ongoing = (data || []).filter(g => !g.completed);
      const completed = (data || []).filter(g => g.completed);
      
      setGoals(ongoing);
      setCompletedGoals(completed);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Erreur lors du chargement des objectifs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const handleEdit = (goal: Goal) => { setEditingGoal(goal); setIsEditModalOpen(true); };
  const requestDelete = (goalId: string) => { setGoalToDelete(goalId); setIsDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!user || !goalToDelete) return;
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalToDelete).eq('user_id', user.id);
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

  const handleCreateSuccess = () => { setIsCreateModalOpen(false); fetchGoals(); };
  const handleEditSuccess = () => { setIsEditModalOpen(false); setEditingGoal(null); fetchGoals(); };

  const handleReorder = async (reorderedGoals: Goal[]) => {
    if (activeTab === "ongoing") setGoals(reorderedGoals);
    else setCompletedGoals(reorderedGoals);

    try {
      const updates = reorderedGoals.map((goal, index) => 
        supabase.from('goals').update({ sort_order: index }).eq('id', goal.id).eq('user_id', user?.id)
      );
      await Promise.all(updates);
    } catch (error) {
      console.error('Error saving goal order:', error);
      toast.error("Erreur lors de la sauvegarde de l'ordre");
      fetchGoals();
    }
  };

  const currentGoals = activeTab === "ongoing" ? goals : completedGoals;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Objectifs</h1>
          {goals.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Progression moyenne : {avgProgress}%
              </span>
              <Progress value={avgProgress} className="w-24 h-1.5" />
            </div>
          )}
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Nouvel objectif</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ongoing" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            En cours ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Terminés ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse backdrop-blur-sm bg-card/60">
                      <CardContent className="p-4">
                        <div className="h-5 bg-muted/60 rounded-xl mb-3"></div>
                        <div className="h-4 bg-muted/40 rounded-xl w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : currentGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-card/30 rounded-3xl border border-border/40 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{activeTab === "ongoing" ? "Pas encore d'objectifs" : "Aucun objectif terminé"}</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">{activeTab === "ongoing" ? "Définissez vos objectifs pour atteindre vos ambitions." : "Vos objectifs accomplis apparaîtront ici."}</p>
                  {activeTab === "ongoing" && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />Créer votre premier objectif
                    </Button>
                  )}
                </div>
              ) : (
                <GoalList 
                  goals={currentGoals}
                  loading={false}
                  onEdit={handleEdit}
                  onDelete={requestDelete}
                  onReorder={handleReorder}
                  onRefresh={fetchGoals}
                />
              )}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {isCreateModalOpen && <CreateModal type="goal" onSuccess={handleCreateSuccess} />}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'objectif</DialogTitle>
          </DialogHeader>
          <CreateGoalForm onSuccess={handleEditSuccess} initialGoal={editingGoal} />
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
