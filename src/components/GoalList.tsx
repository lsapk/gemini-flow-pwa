
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Goal } from '@/types';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubobjectiveList } from './SubobjectiveList';

interface GoalListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export const GoalList = ({ goals, loading, onEdit, onDelete }: GoalListProps) => {
  const { user } = useAuth();

  const updateGoalStatus = async (id: string, completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({ completed })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success(`Objectif ${completed ? 'complété' : 'réactivé'} !`);
      // Ne pas appeler fetchGoals ici car le parent gère le rafraîchissement
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Erreur lors de la mise à jour de l\'objectif');
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

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
          <Card key={goal.id} className="hover:shadow-md transition-shadow">
             <CardContent className="p-2 sm:p-3 md:p-4">
               <div className="flex items-start gap-2 w-full min-w-0">
                 <div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
                   <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
                     <Checkbox
                       checked={goal.completed}
                       onCheckedChange={(checked) =>
                         updateGoalStatus(goal.id, checked as boolean)
                       }
                       size="xl"
                       className="data-[state=checked]:bg-green-500 border-2"
                     />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex flex-col gap-1 mb-1">
                       <h3 className={`font-semibold text-xs sm:text-sm truncate leading-tight ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                         {goal.title}
                       </h3>
                       {goal.category && (
                         <Badge variant="outline" className="text-xs flex-shrink-0 w-fit">
                           {goal.category}
                         </Badge>
                       )}
                     </div>
                     
                     {goal.description && (
                       <p className={`text-muted-foreground mb-1 text-xs line-clamp-2 break-words ${goal.completed ? 'line-through' : ''}`}>
                         {goal.description}
                       </p>
                     )}
                     
                     {goal.target_date && (
                       <p className="text-xs text-muted-foreground mb-1">
                         {format(parseISO(goal.target_date), 'dd/MM/yy', { locale: fr })}
                       </p>
                     )}
                     
                     <div className="mb-2">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                       </div>
                       <Progress value={goal.progress} className="h-2" />
                     </div>
                     
                     <SubobjectiveList goalId={goal.id} />
                   </div>
                 </div>
                 
                 <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(goal)}
                    aria-label="Modifier"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  >
                    <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(goal.id)}
                    aria-label="Supprimer"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
