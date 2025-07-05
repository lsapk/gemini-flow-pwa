
import React from 'react';
import DraggableList from './DraggableList';
import { Habit } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DraggableHabitListProps {
  habits: Habit[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onRefresh: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  showArchived: boolean;
  renderHabit: (habit: Habit) => React.ReactNode;
}

export default function DraggableHabitList({
  habits,
  onRefresh,
  renderHabit
}: DraggableHabitListProps) {
  const { user } = useAuth();

  const updateHabitOrder = async (reorderedHabits: Habit[]) => {
    if (!user) return;

    try {
      const updates = reorderedHabits.map((habit, index) => ({
        id: habit.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('habits')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      onRefresh();
      toast.success('Ordre des habitudes mis à jour');
    } catch (error) {
      console.error('Error updating habit order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  const sortedHabits = [...habits].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <DraggableList
      items={sortedHabits}
      onReorder={updateHabitOrder}
      renderItem={renderHabit}
      getItemId={(habit) => habit.id}
    />
  );
}
