
import { useState, useEffect } from "react";
import { Plus, CheckSquare, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreateModal from "@/components/modals/CreateModal";
import CreateTaskForm from "@/components/modals/CreateTaskForm";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TaskList from "@/components/TaskList";
import { Task } from "@/types";
import { useTaskDragAndDrop } from "@/hooks/useTaskDragAndDrop";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [subtaskParent, setSubtaskParent] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Organiser les tâches avec leurs sous-tâches et corriger les types
      const mainTasks = (data || []).filter(task => !task.parent_task_id);
      const subtasksByParent = (data || []).filter(task => task.parent_task_id)
        .reduce((acc, task) => {
          if (!acc[task.parent_task_id!]) acc[task.parent_task_id!] = [];
          acc[task.parent_task_id!].push({
            ...task,
            priority: (task.priority as 'high' | 'medium' | 'low') || 'low'
          });
          return acc;
        }, {} as Record<string, Task[]>);

      const tasksWithSubtasks = mainTasks.map(task => ({
        ...task,
        priority: (task.priority as 'high' | 'medium' | 'low') || 'low',
        subtasks: subtasksByParent[task.id] || []
      }));

      setTasks(tasksWithSubtasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  // Hook pour le glisser-déposer
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useTaskDragAndDrop(
    tasks,
    async (reorderedTasks) => {
      setTasks(reorderedTasks);
      
      try {
        const updates = reorderedTasks.map((task, index) => ({
          id: task.id,
          sort_order: index
        }));

        for (const update of updates) {
          await supabase
            .from('tasks')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }

        toast.success('Ordre des tâches mis à jour !');
      } catch (error) {
        console.error('Erreur lors du réordonnancement:', error);
        toast.error('Erreur lors de la mise à jour de l\'ordre');
        fetchTasks();
      }
    }
  );

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const requestDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !taskToDelete) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Tâche supprimée !');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression de la tâche');
    } finally {
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !isCompleted })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(isCompleted ? 'Tâche marquée comme non terminée' : 'Tâche terminée !');
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  const handleCreateSubtask = (parentId: string) => {
    setSubtaskParent(parentId);
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setSubtaskParent(null);
    fetchTasks();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
    fetchTasks();
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case "pending":
        return tasks.filter(task => !task.completed);
      case "completed":
        return tasks.filter(task => task.completed);
      case "today":
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => 
          task.due_date && task.due_date.startsWith(today) && !task.completed
        );
      default:
        return tasks.filter(task => !task.completed); // "all" ne montre que les non terminées
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tâches</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tout ({tasks.filter(t => !t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Aujourd'hui
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            En cours
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Terminées ({tasks.filter(t => t.completed).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <TaskList 
            tasks={filteredTasks}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={requestDelete}
            onToggleComplete={toggleTaskCompletion}
            onCreateSubtask={handleCreateSubtask}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <CreateModal 
          type="task"
          onSuccess={handleCreateSuccess}
          parentTaskId={subtaskParent}
        />
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
          </DialogHeader>
          <CreateTaskForm 
            onSuccess={handleEditSuccess}
            task={editingTask}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
