
import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SubTaskManagerProps {
  parentTask: Task;
  subtasks: Task[];
  onSubTasksChange: () => void;
}

export const SubTaskManager: React.FC<SubTaskManagerProps> = ({
  parentTask,
  subtasks,
  onSubTasksChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createSubTask = async () => {
    if (!newSubTaskTitle.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newSubTaskTitle.trim(),
          parent_task_id: parentTask.id,
          user_id: user.id,
          completed: false,
          priority: 'medium'
        });

      if (error) throw error;

      setNewSubTaskTitle('');
      setIsAdding(false);
      onSubTasksChange();
      
      toast({
        title: "Sous-tâche créée",
        description: "La sous-tâche a été ajoutée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la création de la sous-tâche:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la sous-tâche.",
        variant: "destructive",
      });
    }
  };

  const toggleSubTask = async (subTask: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !subTask.completed })
        .eq('id', subTask.id);

      if (error) throw error;
      onSubTasksChange();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la sous-tâche:', error);
    }
  };

  const deleteSubTask = async (subTaskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', subTaskId);

      if (error) throw error;
      onSubTasksChange();
      
      toast({
        title: "Sous-tâche supprimée",
        description: "La sous-tâche a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la sous-tâche:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la sous-tâche.",
        variant: "destructive",
      });
    }
  };

  if (subtasks.length === 0 && !isAdding) {
    return (
      <Button
        onClick={() => setIsAdding(true)}
        variant="ghost"
        size="sm"
        className="text-xs text-gray-500 h-6 px-2"
      >
        <Plus className="w-3 h-3 mr-1" />
        Ajouter une sous-tâche
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {subtasks.length > 0 && (
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className="text-xs text-gray-600 h-6 px-2"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 mr-1" />
          ) : (
            <ChevronRight className="w-3 h-3 mr-1" />
          )}
          {subtasks.length} sous-tâche{subtasks.length > 1 ? 's' : ''}
        </Button>
      )}

      {isExpanded && (
        <div className="ml-4 space-y-1">
          {subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-center gap-2 py-1">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => toggleSubTask(subtask)}
              />
              <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                {subtask.title}
              </span>
              <Button
                onClick={() => deleteSubTask(subtask.id)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="ml-4 flex gap-2 mt-2">
          <Input
            value={newSubTaskTitle}
            onChange={(e) => setNewSubTaskTitle(e.target.value)}
            placeholder="Titre de la sous-tâche"
            className="h-8 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && createSubTask()}
          />
          <Button onClick={createSubTask} size="sm" className="h-8">
            <Plus className="w-3 h-3" />
          </Button>
          <Button 
            onClick={() => {
              setIsAdding(false);
              setNewSubTaskTitle('');
            }} 
            variant="ghost" 
            size="sm" 
            className="h-8"
          >
            Annuler
          </Button>
        </div>
      )}

      {!isAdding && (
        <Button
          onClick={() => setIsAdding(true)}
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 h-6 px-2 ml-4"
        >
          <Plus className="w-3 h-3 mr-1" />
          Ajouter une sous-tâche
        </Button>
      )}
    </div>
  );
};
