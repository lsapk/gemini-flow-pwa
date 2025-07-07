
import React from 'react';
import DraggableList from './DraggableList';
import { Goal } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DraggableGoalListProps {
  goals: Goal[];
  onReorder: (reorderedGoals: Goal[]) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onProgressUpdate: (goalId: string, newProgress: number) => void;
  showArchived: boolean;
  renderGoal?: (goal: Goal) => React.ReactElement;
}

export default function DraggableGoalList({
  goals,
  onReorder,
  onToggle,
  onDelete,
  onProgressUpdate,
  showArchived,
  renderGoal
}: DraggableGoalListProps) {
  const { user } = useAuth();

  const updateGoalOrder = async (reorderedGoals: Goal[]) => {
    if (!user) return;

    try {
      const updates = reorderedGoals.map((goal, index) => ({
        id: goal.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('goals')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      onReorder(reorderedGoals);
      toast.success('Ordre des objectifs mis à jour');
    } catch (error) {
      console.error('Error updating goal order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  const sortedGoals = [...goals].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <DraggableList
      items={sortedGoals}
      onReorder={updateGoalOrder}
      renderItem={(goal) => 
        renderGoal ? renderGoal(goal) : <div>Goal: {goal.title}</div>
      }
      getItemId={(goal) => goal.id}
    />
  );
}
