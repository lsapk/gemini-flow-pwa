
import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableItemProps {
  children: React.ReactNode;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  className?: string;
  isDragging?: boolean;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  children,
  onDragStart,
  onDragEnd,
  onDrop,
  className,
  isDragging = false
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDrop();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group flex items-center gap-2 p-3 bg-white rounded-lg border transition-all duration-200",
        isDragging && "opacity-50 scale-95",
        dragOver && "border-blue-500 bg-blue-50",
        className
      )}
    >
      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-70 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
