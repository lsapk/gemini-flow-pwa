import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Goal } from '@/types';
import { getGoals, updateGoal, deleteGoal } from '@/lib/api';
import { toast } from 'sonner';
import { SubobjectiveList } from './SubobjectiveList';

export const GoalList = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await getGoals();
      if (error) {
        setError(error.message || 'Failed to fetch goals');
      } else {
        setGoals(data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const updateGoalStatus = async (id: string, completed: boolean) => {
    try {
      await updateGoal(id, { completed });
      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === id ? { ...goal, completed } : goal
        )
      );
      toast.success(`Objectif mis à jour`);
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour de l'objectif: ${error.message}`);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
      toast.success(`Objectif supprimé`);
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression de l'objectif: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Aucun objectif pour le moment
          </h3>
          <p className="text-sm text-muted-foreground">
            Créez votre premier objectif pour commencer
          </p>
        </div>
      ) : (
        goals.map((goal) => (
          <Card key={goal.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={goal.completed}
                  onCheckedChange={(checked) =>
                    updateGoal(goal.id, { completed: checked as boolean })
                  }
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.title}
                    </h3>
                    {goal.category && (
                      <Badge variant="outline" className="text-xs">
                        {goal.category}
                      </Badge>
                    )}
                  </div>
                  {goal.description && (
                    <p className={`text-sm mb-2 ${goal.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {goal.description}
                    </p>
                  )}
                  {goal.target_date && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Échéance: {format(parseISO(goal.target_date), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  )}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Progrès: {goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                  <SubobjectiveList goalId={goal.id} />
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGoal(goal.id)}
                  className="hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
