
import { useState, useEffect } from "react";
import { Plus, Target, Trophy, CheckCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GoalList } from "@/components/GoalList";
import { Goal } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Séparer les objectifs en cours et terminés
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

  const currentGoals = activeTab === "ongoing" ? goals : completedGoals;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">
          <div className="md:hidden">
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="pt-14 md:pt-6 px-3 md:px-6">
            <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <h1 className="text-lg md:text-2xl font-bold tracking-tight">Objectifs</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto text-sm px-3 py-2">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="sm:hidden">Nouvel</span>
                  <span className="hidden sm:inline">Nouvel objectif</span>
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="ongoing" className="flex items-center gap-1 text-sm py-2 px-3">
                    <Target className="h-4 w-4" />
                    <span className="hidden xs:inline">En cours</span>
                    <span className="xs:hidden">Cours</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 h-5">
                      {goals.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center gap-1 text-sm py-2 px-3">
                    <Trophy className="h-4 w-4" />
                    <span className="hidden xs:inline">Terminés</span>
                    <span className="xs:hidden">Term.</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 h-5">
                      {completedGoals.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {isLoading ? (
                    <div className="grid gap-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-5 bg-muted rounded mb-3"></div>
                            <div className="h-4 bg-muted rounded w-2/3"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : currentGoals.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        {activeTab === "ongoing" ? (
                          <>
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Aucun objectif en cours</h3>
                            <p className="text-muted-foreground text-center mb-4 px-4 text-sm">
                              Définissez vos objectifs pour atteindre vos ambitions.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="px-6">
                              <Plus className="h-4 w-4 mr-2" />
                              Créer votre premier objectif
                            </Button>
                          </>
                        ) : (
                          <>
                            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Aucun objectif terminé</h3>
                            <p className="text-muted-foreground text-center px-4 text-sm">
                              Vos objectifs accomplis apparaîtront ici.
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <GoalList 
                      goals={currentGoals}
                      loading={false}
                      onEdit={handleEdit}
                      onDelete={requestDelete}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateModal 
          type="goal"
          onSuccess={handleCreateSuccess}
        />
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'objectif</DialogTitle>
          </DialogHeader>
          <CreateGoalForm 
            onSuccess={handleEditSuccess}
            initialGoal={editingGoal}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'objectif sera définitivement supprimé.
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
