
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DragItem {
  id: string;
  index: number;
  type: 'habit' | 'task' | 'goal';
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDrop = useCallback(async (targetIndex: number, items: any[], tableName: string) => {
    if (!draggedItem) return items;

    const newItems = [...items];
    const draggedIndex = draggedItem.index;
    
    // Réorganiser les éléments
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Mettre à jour les sort_order dans la base de données
    const updates = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));

    try {
      for (const update of updates) {
        await supabase
          .from(tableName)
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordre:', error);
    }

    return newItems;
  }, [draggedItem]);

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDrop
  };
};
