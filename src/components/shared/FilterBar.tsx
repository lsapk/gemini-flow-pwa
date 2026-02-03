import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, LayoutGrid, LayoutList, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'grid';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  priorityFilter?: 'all' | 'high' | 'medium' | 'low';
  onPriorityFilterChange?: (priority: 'all' | 'high' | 'medium' | 'low') => void;
  showPriorityFilter?: boolean;
  showViewToggle?: boolean;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  viewMode,
  onViewModeChange,
  priorityFilter = 'all',
  onPriorityFilterChange,
  showPriorityFilter = true,
  showViewToggle = true,
  className,
}: FilterBarProps) {
  const priorities = [
    { value: 'all', label: 'Toutes', className: '' },
    { value: 'high', label: 'Haute', className: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-400' },
    { value: 'medium', label: 'Moyenne', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400' },
    { value: 'low', label: 'Basse', className: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-400' },
  ] as const;

  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8 h-9"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Priority Filters */}
      {showPriorityFilter && onPriorityFilterChange && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => onPriorityFilterChange(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                priorityFilter === p.value
                  ? p.value === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : p.className + ' ring-2 ring-offset-1 ring-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* View Toggle */}
      {showViewToggle && (
        <div className="flex border rounded-lg p-0.5 bg-muted/50">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8 px-3"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
