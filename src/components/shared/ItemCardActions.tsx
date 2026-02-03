import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Trash2, 
  Archive, 
  RotateCcw,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ItemCardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isArchived?: boolean;
  showInline?: boolean;
  className?: string;
}

export function ItemCardActions({
  onEdit,
  onDelete,
  onArchive,
  isArchived = false,
  showInline = false,
  className,
}: ItemCardActionsProps) {
  if (showInline) {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        {onArchive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title={isArchived ? 'Restaurer' : 'Archiver'}
          >
            {isArchived ? (
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Modifier"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn('h-7 w-7 p-0', className)}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
        )}
        {onArchive && (
          <DropdownMenuItem onClick={onArchive}>
            {isArchived ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurer
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </>
            )}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Expand/Collapse toggle for subtasks
interface ExpandToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  label?: string;
}

export function ExpandToggle({ isExpanded, onToggle, count, label = 'sous-éléments' }: ExpandToggleProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      {count !== undefined && (
        <span>{count} {label}</span>
      )}
    </button>
  );
}

// Add button for inline creation
interface AddButtonProps {
  onClick: () => void;
  label?: string;
}

export function AddButton({ onClick, label }: AddButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      <Plus className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );
}
