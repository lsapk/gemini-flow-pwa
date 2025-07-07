import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Calendar, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import CreateModal from "@/components/modals/CreateModal";
import DraggableGoalList from "@/components/DraggableGoalList";
import { Goal } from "@/types/index";

export default function Goals() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id, showArchived],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', showArchived)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  const updateGoalOrder = useMutation({
    mutationFn: async (reorderedGoals: Goal[]) => {
      const updates = reorderedGoals.map((goal, index) => ({
        id: goal.id,
        sort_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('goals')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      console.error('Erreur lors de la réorganisation:', error);
      toast.error('Erreur lors de la réorganisation des objectifs');
    }
  });

  const toggleGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const { error } = await supabase
        .from('goals')
        .update({ 
          completed: !goal.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Objectif mis à jour !');
    },
    onError: (error) => {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const updateProgress = useMutation({
    mutationFn: async ({ goalId, newProgress }: { goalId: string; newProgress: number }) => {
      const { error } = await supabase
        .from('goals')
        .update({ 
          progress: Math.max(0, Math.min(100, newProgress)),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Progrès mis à jour !');
    },
    onError: (error) => {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du progrès');
    }
  });

  const archiveGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ 
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Objectif archivé !');
    }
  });

  const restoreGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ 
          is_archived: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Objectif restauré !');
    }
  });

  const handleReorder = (reorderedGoals: Goal[]) => {
    updateGoalOrder.mutate(reorderedGoals);
  };

  const handleProgressUpdate = (goalId: string, newProgress: number) => {
    updateProgress.mutate({ goalId, newProgress });
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.completed).length;
  const inProgressGoals = goals.filter(goal => !goal.completed && (goal.progress || 0) > 0).length;
  const upcomingDeadlines = goals.filter(goal => {
    if (!goal.target_date || goal.completed) return false;
    const daysUntil = differenceInDays(new Date(goal.target_date), new Date());
    return daysUntil <= 7 && daysUntil >= 0;
  }).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Objectifs
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Définissez et atteignez vos objectifs
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? 'Actifs' : 'Archivés'}
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouvel objectif</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
      </div>

      {!showArchived && totalGoals > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalGoals}
                </div>
                <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300">
                  Total
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                  {completedGoals}
                </div>
                <p className="text-xs md:text-sm text-green-700 dark:text-green-300">
                  Terminés
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {inProgressGoals}
                </div>
                <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300">
                  En cours
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {upcomingDeadlines}
                </div>
                <p className="text-xs md:text-sm text-purple-700 dark:text-purple-300">
                  Échéances
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DraggableGoalList
        goals={goals}
        onReorder={handleReorder}
        onToggle={(id) => toggleGoal.mutate(id)}
        onDelete={(id) => showArchived ? restoreGoal.mutate(id) : archiveGoal.mutate(id)}
        onProgressUpdate={handleProgressUpdate}
        showArchived={showArchived}
      />

      <CreateModal
        type="goal"
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}
