import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import TaskList from "@/components/TaskList";
import { AIAssistantEnhanced } from "@/components/ui/AIAssistantEnhanced";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DraggableItem } from "@/components/ui/DraggableItem";
import { SubTaskManager } from "@/components/ui/SubTaskManager";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  parent_task_id?: string;
  subtasks?: Task[];
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const { draggedItem, handleDragStart, handleDragEnd, handleDrop } = useDragAndDrop();

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Organiser les tâches avec leurs sous-tâches
      const mainTasks = data?.filter(task => !task.parent_task_id) || [];
      const tasksWithSubtasks = mainTasks.map(task => ({
        ...task,
        priority: (task.priority as 'high' | 'medium' | 'low') || 'medium',
        subtasks: data?.filter(subtask => subtask.parent_task_id === task.id).map(subtask => ({
          ...subtask,
          priority: (subtask.priority as 'high' | 'medium' | 'low') || 'medium'
        })) || []
      }));

      setTasks(tasksWithSubtasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (targetIndex: number) => {
    const updatedTasks = await handleDrop(targetIndex, tasks, 'tasks');
    setTasks(updatedTasks);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchTasks();
  };

  const handleEdit = (task: Task) => {
    // Fonction placeholder - pourrait ouvrir un modal d'édition
    console.log('Edit task:', task);
  };

  const handleDelete = (id: string) => {
    // Fonction placeholder - pourrait ouvrir un dialog de confirmation
    console.log('Delete task:', id);
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tâches</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune tâche</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par créer votre première tâche pour organiser votre travail.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer votre première tâche
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <DraggableItem
              key={task.id}
              onDragStart={() => handleDragStart({ id: task.id, index, type: 'task' })}
              onDragEnd={handleDragEnd}
              onDrop={() => handleReorder(index)}
              isDragging={draggedItem?.id === task.id}
            >
              <div className="space-y-2">
                <TaskList 
                  tasks={[task]}
                  loading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleComplete={handleToggleComplete}
                />
                {/* Gestion des sous-tâches */}
                <SubTaskManager 
                  parentTask={task}
                  subtasks={task.subtasks || []}
                  onSubTasksChange={fetchTasks}
                />
              </div>
            </DraggableItem>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateModal 
          type="task"
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* AI Assistant */}
      <AIAssistantEnhanced />
    </div>
  );
}