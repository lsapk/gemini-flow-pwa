
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SubobjectiveForm } from './SubobjectiveForm';

interface Subobjective {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  sort_order: number;
}

interface SubobjectiveListProps {
  goalId: string;
}

export const SubobjectiveList = ({ goalId }: SubobjectiveListProps) => {
  const { user } = useAuth();
  const [subobjectives, setSubobjectives] = useState<Subobjective[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubobjective, setEditingSubobjective] = useState<Subobjective | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubobjectives = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subobjectives')
        .select('*')
        .eq('parent_goal_id', goalId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSubobjectives(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-objectifs:', error);
    }
  };

  useEffect(() => {
    fetchSubobjectives();
  }, [goalId, user]);

  const toggleCompletion = async (subobjectiveId: string, completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subobjectives')
        .update({ completed })
        .eq('id', subobjectiveId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSubobjectives(prev =>
        prev.map(sub =>
          sub.id === subobjectiveId ? { ...sub, completed } : sub
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du sous-objectif:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteSubobjective = async (subobjectiveId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subobjectives')
        .delete()
        .eq('id', subobjectiveId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSubobjectives(prev => prev.filter(sub => sub.id !== subobjectiveId));
      toast.success('Sous-objectif supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du sous-objectif:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditSubobjective = (subobjective: Subobjective) => {
    setEditingSubobjective(subobjective);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSubobjective(null);
    fetchSubobjectives();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSubobjective(null);
  };

  if (subobjectives.length === 0 && !showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
        className="mt-2 h-8 text-xs"
      >
        <Plus className="w-3 h-3 mr-1" />
        Ajouter un sous-objectif
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0 hover:bg-accent"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {subobjectives.length} sous-objectif{subobjectives.length > 1 ? 's' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="h-6 w-6 p-0 ml-auto"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {showForm && (
        <SubobjectiveForm
          parentGoalId={goalId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          initialSubobjective={editingSubobjective}
        />
      )}

      {isExpanded && (
        <div className="ml-4 space-y-2">
          {subobjectives.map((subobjective) => (
            <div
              key={subobjective.id}
              className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
            >
              <Checkbox
                checked={subobjective.completed}
                onCheckedChange={(checked) =>
                  toggleCompletion(subobjective.id, checked as boolean)
                }
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${subobjective.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {subobjective.title}
                </p>
                {subobjective.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {subobjective.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditSubobjective(subobjective)}
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSubobjective(subobjective.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/20"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
