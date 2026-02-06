import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '@/types';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubobjectiveList } from './SubobjectiveList';
import { ItemCard, FilterBar, ViewMode, ProgressRing } from "@/components/shared/ItemCard";
import { Progress } from "@/components/ui/progress";
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GoalListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onReorder?: (goals: Goal[]) => void;
  onRefresh?: () => void;
}

interface SortableGoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onStatusUpdate: (id: string, completed: boolean) => void;
  userId: string | undefined;
  isExpanded: boolean;
  onToggleExpanded: (goalId: string) => void;
  onRefresh?: () => void;
}

function SortableGoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onStatusUpdate, 
  userId,
  isExpanded,
  onToggleExpanded,
  onRefresh 
}: SortableGoalCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleProgressIncrement = async () => {
    const newProgress = Math.min(100, goal.progress + 10);
    const { error } = await supabase
      .from('goals')
      .update({ progress: newProgress })
      .eq('id', goal.id)
      .eq('user_id', userId);
    
    if (!error) {
      toast.success('Progrès mis à jour +10%');
      onRefresh?.();
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        type="goal"
        data={goal}
        variant={isExpanded ? 'expanded' : 'standard'}
        onComplete={() => onStatusUpdate(goal.id, goal.completed)}
        onEdit={() => onEdit(goal)}
        onDelete={() => onDelete(goal.id)}
        isDragging={isDragging}
        dragHandleProps={{ listeners, attributes }}
      >
        {/* Goal-specific content */}
        <div className="space-y-3">
          {/* Progress Section */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{goal.progress}%</span>
                {!goal.completed && goal.progress < 100 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={handleProgressIncrement}
                  >
                    +10%
                  </Button>
                )}
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          </div>
          
          {/* Subobjectives toggle */}
          <div className="pt-2 border-t">
            <button
              onClick={() => onToggleExpanded(goal.id)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <span className="flex-1 text-left">Sous-objectifs</span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>
          </div>

          {/* Subobjectives List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SubobjectiveList goalId={goal.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ItemCard>
    </div>
  );
}

export const GoalList = ({ goals, loading, onEdit, onDelete, onReorder, onRefresh }: GoalListProps) => {
  const { user } = useAuth();
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  const toggleExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const updateGoalStatus = async (id: string, completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({ completed: !completed })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success(`Objectif ${!completed ? 'complété' : 'réactivé'} !`);
      onRefresh?.();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Erreur lors de la mise à jour de l\'objectif');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = goals.findIndex((g) => g.id === active.id);
      const newIndex = goals.findIndex((g) => g.id === over.id);
      const newGoals = arrayMove(goals, oldIndex, newIndex);
      onReorder?.(newGoals);
    }
  };

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchValue.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted" />
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

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun objectif</h3>
          <p className="text-muted-foreground">
            Créez votre premier objectif pour commencer
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
        showPriorityFilter={false}
        showViewToggle={false}
      />

      {/* Goals List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredGoals.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <motion.div layout className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filteredGoals.map((goal) => (
                <SortableGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusUpdate={updateGoalStatus}
                  userId={user?.id}
                  isExpanded={expandedGoals.has(goal.id)}
                  onToggleExpanded={toggleExpanded}
                  onRefresh={onRefresh}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>
      </DndContext>

      {/* Empty filtered state */}
      {filteredGoals.length === 0 && goals.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucun objectif ne correspond à votre recherche.
            </p>
            <Button 
              variant="link" 
              onClick={() => setSearchValue('')}
            >
              Réinitialiser la recherche
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
