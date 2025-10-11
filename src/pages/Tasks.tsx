import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TaskList from "@/components/TaskList";
import { useQuery } from "@tanstack/react-query";
import CreateModal from "@/components/modals/CreateModal";
import EditTaskModal from "@/components/modals/EditTaskModal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CheckSquare, Clock } from "lucide-react";
import { useGoogleTasks } from "@/hooks/useGoogleTasks";
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

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  user_id: string;
  parent_task_id?: string | null;
  sort_order?: number;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  description?: string;
  priority?: string;
  parent_task_id: string;
}

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [subtasks, setSubtasks] = useState<{ [taskId: string]: Subtask[] }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  
  const googleTasks = useGoogleTasks();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && !googleTasks.isConnected) {
      googleTasks.handleOAuthCallback(code);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const mappedTasks = (data || []).map(task => ({
        ...task,
        priority: task.priority as "low" | "medium" | "high" | null
      })) as Task[];

      // Sort by priority: high -> medium -> low -> null
      return mappedTasks.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        return bPriority - aPriority;
      });
    },
    enabled: !!user,
  });

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const currentTasks = activeTab === "pending" ? pendingTasks : completedTasks;

  const fetchSubtasks = async () => {
    if (!user || tasks.length === 0) return;

    const taskIds = tasks.map(task => task.id);
    
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .in('parent_task_id', taskIds)
      .eq('user_id', user.id)
      .order('sort_order');

    if (error) {
      console.error('Error fetching subtasks:', error);
      return;
    }

    const subtasksByTask: { [taskId: string]: Subtask[] } = {};
    data?.forEach((subtask) => {
      if (!subtasksByTask[subtask.parent_task_id]) {
        subtasksByTask[subtask.parent_task_id] = [];
      }
      subtasksByTask[subtask.parent_task_id].push(subtask);
    });

    setSubtasks(subtasksByTask);
  };

  useEffect(() => {
    fetchSubtasks();
  }, [user, tasks]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleRefreshSubtasks = () => {
    fetchSubtasks();
  };

  const handleTaskCreated = () => {
    setIsCreateModalOpen(false);
    refetch();
    fetchSubtasks();
  };

  const handleTaskEdited = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
    refetch();
    fetchSubtasks();
  };

  const handleSyncWithGoogle = async () => {
    if (!googleTasks.isConnected) {
      toast({
        title: "Non connecté",
        description: "Veuillez d'abord vous connecter à Google Tasks",
        variant: "destructive",
      });
      return;
    }

    try {
      // Load Google Tasks
      await googleTasks.loadTasks();

      // Sync DeepFlow tasks to Google Tasks
      for (const task of pendingTasks) {
        const existingGoogleTask = googleTasks.tasks.find(
          gt => gt.title === task.title
        );

        if (!existingGoogleTask) {
          await googleTasks.createTask({
            title: task.title,
            notes: task.description || undefined,
            due: task.due_date || undefined,
          });
        }
      }

      // Sync Google Tasks to DeepFlow
      for (const googleTask of googleTasks.tasks) {
        if (googleTask.status === 'completed') continue;

        const existingDeepFlowTask = tasks.find(
          t => t.title === googleTask.title
        );

        if (!existingDeepFlowTask && user) {
          await supabase.from('tasks').insert({
            user_id: user.id,
            title: googleTask.title,
            description: googleTask.notes || null,
            due_date: googleTask.due || null,
            completed: false,
          });
        }
      }

      await refetch();
      await googleTasks.loadTasks();

      toast({
        title: "Synchronisation réussie",
        description: "Vos tâches ont été synchronisées avec Google Tasks",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="pt-16 md:pt-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Tâches</h1>
            <div className="flex gap-2">
              {googleTasks.isConnected ? (
                <>
                  <Button 
                    onClick={() => setShowSyncDialog(true)} 
                    size="sm" 
                    variant="outline"
                    disabled={googleTasks.isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${googleTasks.isLoading ? 'animate-spin' : ''}`} />
                    Synchroniser
                  </Button>
                  <Button 
                    onClick={googleTasks.disconnect} 
                    size="sm" 
                    variant="outline"
                  >
                    <CloudOff className="h-4 w-4 mr-2" />
                    Déconnecter
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={googleTasks.connectToGoogle} 
                  size="sm" 
                  variant="outline"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Google Tasks
                </Button>
              )}
              <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="pending" className="flex items-center gap-1 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">En cours</span>
                <span className="xs:hidden">Cours</span>
                ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1 text-xs sm:text-sm">
                <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Terminées</span>
                <span className="xs:hidden">Fini</span>
                ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <TaskList
                tasks={currentTasks}
                loading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
                subtasks={subtasks}
                onRefreshSubtasks={handleRefreshSubtasks}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateModal 
          type="task"
          onSuccess={handleTaskCreated}
        />
      )}

      {isEditModalOpen && (
        <EditTaskModal 
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleTaskEdited}
        />
      )}

      <AlertDialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Synchroniser avec Google Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va synchroniser vos tâches DeepFlow avec Google Tasks dans les deux sens :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Les tâches DeepFlow seront ajoutées à Google Tasks</li>
                <li>Les tâches Google Tasks seront importées dans DeepFlow</li>
              </ul>
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncWithGoogle}>
              Synchroniser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
