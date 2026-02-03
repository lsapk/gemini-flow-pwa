import React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  listeners?: any;
  attributes?: any;
  className?: string;
}

export function DragHandle({ listeners, attributes, className }: DragHandleProps) {
  return (
    <div
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors touch-none',
        className
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
