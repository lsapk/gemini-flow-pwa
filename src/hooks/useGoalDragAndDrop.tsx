
import { useState } from 'react';
import { Goal } from '@/types';

export const useGoalDragAndDrop = (
  goals: Goal[],
  onReorder: (reorderedGoals: Goal[]) => void
) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedItem(id);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedItem(null);
      setDraggedIndex(null);
      return;
    }

    const newGoals = [...goals];
    const [draggedGoal] = newGoals.splice(draggedIndex, 1);
    newGoals.splice(dropIndex, 0, draggedGoal);
    
    onReorder(newGoals);
    
    setDraggedItem(null);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedIndex(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    draggedItem
  };
};
