
import { useState } from 'react';

interface DragItem {
  id: string;
  index: number;
}

export const useDragAndDrop = (items: any[], onReorder: (newOrder: any[]) => void) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedItem({ id, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...items];
    const draggedElement = newItems[draggedItem.index];
    
    // Remove the dragged item
    newItems.splice(draggedItem.index, 1);
    
    // Insert at new position
    newItems.splice(targetIndex, 0, draggedElement);
    
    // Update sort_order for all items
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      sort_order: index
    }));
    
    onReorder(reorderedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
};
