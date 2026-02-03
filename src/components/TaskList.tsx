import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { SubtaskList } from "./SubtaskList";
import { ItemCard, FilterBar, ViewMode } from "@/components/shared/ItemCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  due_date?: string;
  created_at?: string;
};

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  subtasks?: { [taskId: string]: any[] };
  onRefreshSubtasks?: () => void;
  onReorder?: (tasks: Task[]) => void;
}

interface SortableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  taskSubtasks: any[];
  isExpanded: boolean;
  onToggleExpanded: (taskId: string) => void;
  onRefreshSubtasks: () => void;
  viewMode: ViewMode;
}

function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  taskSubtasks,
  isExpanded,
  onToggleExpanded,
  onRefreshSubtasks,
  viewMode,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedSubtasks = taskSubtasks.filter(s => s.completed).length;

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        type="task"
        data={task}
        variant={isExpanded ? 'expanded' : 'standard'}
        onComplete={() => onToggleComplete(task.id, task.completed)}
        onEdit={() => onEdit(task)}
        onDelete={() => onDelete(task.id)}
        isDragging={isDragging}
        dragHandleProps={{ listeners, attributes }}
        subtaskCount={taskSubtasks.length}
        subtaskCompleted={completedSubtasks}
      >
        {/* Subtask toggle and list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onToggleExpanded(task.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>{taskSubtasks.length} sous-tâche{taskSubtasks.length !== 1 ? 's' : ''}</span>
            </button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!isExpanded) {
                  onToggleExpanded(task.id);
                }
              }}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SubtaskList
                  taskId={task.id}
                  subtasks={taskSubtasks}
                  onRefresh={onRefreshSubtasks}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ItemCard>
    </div>
  );
}

export default function TaskList({
  tasks,
  loading,
  onEdit,
  onDelete,
  onToggleComplete,
  subtasks = {},
  onRefreshSubtasks = () => {},
  onReorder
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder?.(newTasks);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune tâche</h3>
          <p className="text-muted-foreground">
            Commencez par créer votre première tâche !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        showPriorityFilter
        showViewToggle
      />

      {/* Task Grid/List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={filteredTasks.map(t => t.id)} 
          strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <motion.div 
            layout
            className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" 
                : "flex flex-col gap-3"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map(task => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleComplete={onToggleComplete}
                  taskSubtasks={subtasks[task.id] || []}
                  isExpanded={expandedTasks.has(task.id)}
                  onToggleExpanded={toggleExpanded}
                  onRefreshSubtasks={onRefreshSubtasks}
                  viewMode={viewMode}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>
      </DndContext>

      {/* Empty filtered state */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucune tâche ne correspond à vos filtres.
            </p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchValue('');
                setPriorityFilter('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
