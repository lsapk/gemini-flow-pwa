
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DragItem {
  id: string;
  index: number;
}

type TableName = 'habits' | 'tasks' | 'goals';

export const useDragAndDrop = (items: any[], tableName: TableName, onReorder: () => void) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedItem({ id, index });
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      setIsDragging(false);
      return;
    }

    try {
      // Réorganiser les éléments
      const newItems = [...items];
      const [removed] = newItems.splice(draggedItem.index, 1);
      newItems.splice(targetIndex, 0, removed);

      // Mettre à jour les sort_order dans la base de données
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from(tableName)
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      onReorder();
      toast.success('Ordre mis à jour');
    } catch (error) {
      console.error('Erreur lors de la réorganisation:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    } finally {
      setDraggedItem(null);
      setIsDragging(false);
    }
  };

  const handleTouchStart = (id: string, index: number) => {
    setDraggedItem({ id, index });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  const handleTouchEnd = async (targetIndex: number) => {
    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      return;
    }

    try {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedItem.index, 1);
      newItems.splice(targetIndex, 0, removed);

      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from(tableName)
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      onReorder();
      toast.success('Ordre mis à jour');
    } catch (error) {
      console.error('Erreur lors de la réorganisation:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    } finally {
      setDraggedItem(null);
    }
  };

  return {
    draggedItem,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
