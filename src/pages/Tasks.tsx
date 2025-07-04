
import { useState, useEffect } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DragHandle } from "@/components/DragHandle";
import { SubTaskForm } from "@/components/SubTaskForm";
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
} from "@/components/ui/alert-dialog"
import TaskList from "@/components/TaskList";
import { Task } from "@/types";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<{[key: string]: Task[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allTasks = (data || []) as Task[];
      setTasks(allTasks);

      // Organiser les sous-tâches par tâche parente
      const subTasksMap: {[key: string]: Task[]} = {};
      allTasks.forEach(task => {
        if (task.parent_task_id) {
          if (!subTasksMap[task.parent_task_id]) {
            subTasksMap[task.parent_task_id] = [];
          }
          subTasksMap[task.parent_task_id].push(task);
        }
      });
      setSubTasks(subTasksMap);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  // Séparer les tâches principales et sous-tâches
  const mainTasks = tasks.filter(task => !task.parent_task_id);
  const dragAndDrop = useDragAndDrop(mainTasks, 'tasks', fetchTasks);

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

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;

      fetchTasks();
      toast.success(completed ? 'Tâche terminée !' : 'Tâche remise en cours');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchTasks();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
    fetchTasks();
  };

  // Filtrer les tâches selon l'onglet (exclure les terminées de "Tout")
  const getFilteredTasks = (tab: string) => {
    const filtered = mainTasks.filter(task => {
      switch (tab) {
        case 'all':
          return !task.completed; // Exclure les terminées
        case 'completed':
          return task.completed;
        case 'pending':
          return !task.completed;
        default:
          return true;
      }
    });
    return filtered;
  };

  const renderTaskCard = (task: Task, index: number) => (
    <Card 
      key={task.id}
      draggable
      onDragStart={(e) => dragAndDrop.handleDragStart(e, task.id, index)}
      onDragOver={dragAndDrop.handleDragOver}
      onDrop={(e) => dragAndDrop.handleDrop(e, index)}
      className={`transition-all duration-200 ${
        dragAndDrop.draggedItem?.id === task.id ? 'opacity-50 scale-95' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <DragHandle
            onDragStart={(e) => dragAndDrop.handleDragStart(e, task.id, index)}
            onTouchStart={() => dragAndDrop.handleTouchStart(task.id, index)}
            onTouchMove={dragAndDrop.handleTouchMove}
            onTouchEnd={() => dragAndDrop.handleTouchEnd(index)}
          />
          <div className="flex-1 space-y-3">
            <TaskList 
              tasks={[task]}
              loading={false}
              onDelete={requestDelete}
              onEdit={handleEdit}
              onToggle={toggleTask}
            />
            
            {/* Afficher les sous-tâches */}
            {subTasks[task.id] && subTasks[task.id].length > 0 && (
              <div className="ml-6 space-y-2">
                {subTasks[task.id].map(subTask => (
                  <div key={subTask.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={subTask.completed}
                      onChange={(e) => toggleTask(subTask.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className={`text-sm ${subTask.completed ? 'line-through text-gray-500' : ''}`}>
                      {subTask.title}
                    </span>
                    {subTask.priority && (
                      <Badge variant={subTask.priority === 'high' ? 'destructive' : subTask.priority === 'medium' ? 'default' : 'secondary'}>
                        {subTask.priority}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Formulaire pour ajouter une sous-tâche */}
            {!task.completed && (
              <div className="ml-6">
                <SubTaskForm 
                  parentTaskId={task.id} 
                  onSubTaskCreated={fetchTasks}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tâches</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="pending">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : getFilteredTasks('all').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune tâche en cours</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Créez votre première tâche pour commencer à organiser votre travail.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre première tâche
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredTasks('all').map((task, index) => renderTaskCard(task, index))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {getFilteredTasks('pending').map((task, index) => renderTaskCard(task, index))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {getFilteredTasks('completed').map((task, index) => (
              <TaskList 
                key={task.id}
                tasks={[task]}
                loading={false}
                onDelete={requestDelete}
                onEdit={handleEdit}
                onToggle={toggleTask}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <CreateModal 
          type="task"
          onSuccess={handleCreateSuccess}
        />
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
          </DialogHeader>
          <CreateTaskForm 
            onSuccess={handleEditSuccess}
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
