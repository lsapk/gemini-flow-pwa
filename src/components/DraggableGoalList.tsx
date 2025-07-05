
import React from 'react';
import DraggableList from './DraggableList';
import { Goal } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DraggableGoalListProps {
  goals: Goal[];
  onRefresh: () => void;
  renderGoal: (goal: Goal) => React.ReactNode;
}

export default function DraggableGoalList({
  goals,
  onRefresh,
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

      onRefresh();
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
      renderItem={renderGoal}
      getItemId={(goal) => goal.id}
    />
  );
}
