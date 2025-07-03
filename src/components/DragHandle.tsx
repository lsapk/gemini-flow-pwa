
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragHandleProps {
  onDragStart?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  className?: string;
}

export const DragHandle = ({ 
  onDragStart, 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd,
  className 
}: DragHandleProps) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none select-none p-1 hover:bg-gray-100 rounded transition-colors",
        className
      )}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
    </div>
  );
};
