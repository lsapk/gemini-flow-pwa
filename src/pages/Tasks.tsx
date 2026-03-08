import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Cloud, CloudOff, RefreshCw, CheckSquare, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TaskList from "@/components/TaskList";
import { useQuery } from "@tanstack/react-query";
import CreateModal from "@/components/modals/CreateModal";
import EditTaskModal from "@/components/modals/EditTaskModal";
import { PagePenguinEmpty } from "@/components/penguin/PagePenguinEmpty";
import penguinBusy from "@/assets/penguin-busy.png";
import { usePenguinRewards } from "@/hooks/usePenguinRewards";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Progress } from "@/components/ui/progress";

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
  google_task_id?: string | null;
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
  const { rewardTaskComplete } = usePenguinRewards();
  
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
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const mappedTasks = (data || []).map(task => ({
        ...task,
        priority: task.priority as "low" | "medium" | "high" | null
      })) as Task[];

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
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const fetchSubtasks = async () => {
    if (!user || tasks.length === 0) return;
    const taskIds = tasks.map(task => task.id);
    
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .in('parent_task_id', taskIds)
      .eq('user_id', user.id)
      .order('sort_order');

    if (error) { console.error('Error fetching subtasks:', error); return; }

    const subtasksByTask: { [taskId: string]: Subtask[] } = {};
    data?.forEach((subtask) => {
      if (!subtasksByTask[subtask.parent_task_id]) subtasksByTask[subtask.parent_task_id] = [];
      subtasksByTask[subtask.parent_task_id].push(subtask);
    });
    setSubtasks(subtasksByTask);
  };

  useEffect(() => { fetchSubtasks(); }, [user, tasks]);

  const handleEdit = (task: Task) => { setEditingTask(task); setIsEditModalOpen(true); };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw new Error(error.message);
      toast({ title: 'Success', description: 'Task deleted successfully' });
      refetch();
    } catch (error: any) { toast({ title: 'Error', description: error.message }); }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === id);
      const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
      if (error) throw new Error(error.message);
      if (!completed && task) rewardTaskComplete();
      toast({ title: 'Success', description: 'Task updated successfully' });
      refetch();
    } catch (error: any) { toast({ title: 'Error', description: error.message }); }
  };

  const handleRefreshSubtasks = () => fetchSubtasks();
  const handleTaskCreated = () => { setIsCreateModalOpen(false); refetch(); fetchSubtasks(); };
  const handleTaskEdited = () => { setIsEditModalOpen(false); setEditingTask(null); refetch(); fetchSubtasks(); };

  const handleReorder = async (reorderedTasks: Task[]) => {
    try {
      const updates = reorderedTasks.map((task, index) => 
        supabase.from('tasks').update({ sort_order: index }).eq('id', task.id).eq('user_id', user?.id)
      );
      await Promise.all(updates);
      refetch();
    } catch (error) {
      console.error('Error saving task order:', error);
      toast({ title: 'Erreur', description: "Erreur lors de la sauvegarde de l'ordre", variant: 'destructive' });
    }
  };

  const handleSyncWithGoogle = async () => {
    if (!googleTasks.isConnected) {
      toast({ title: "Non connecté", description: "Veuillez d'abord vous connecter à Google Tasks", variant: "destructive" });
      return;
    }
    try {
      await googleTasks.loadTasks();
      let syncedToGoogle = 0;
      let syncedFromGoogle = 0;
      for (const task of pendingTasks) {
        if (task.google_task_id) continue;
        const googleTaskId = await googleTasks.createTask({ title: task.title, notes: task.description || undefined, due: task.due_date || undefined });
        if (googleTaskId) {
          await supabase.from('tasks').update({ google_task_id: googleTaskId }).eq('id', task.id);
          syncedToGoogle++;
        }
      }
      for (const googleTask of googleTasks.tasks) {
        if (googleTask.status === 'completed') continue;
        const existingTask = tasks.find(t => t.google_task_id === googleTask.id);
        if (!existingTask && user) {
          await supabase.from('tasks').insert({ user_id: user.id, title: googleTask.title, description: googleTask.notes || null, due_date: googleTask.due || null, completed: false, google_task_id: googleTask.id });
          syncedFromGoogle++;
        }
      }
      await refetch();
      toast({ title: "Synchronisation réussie", description: `${syncedToGoogle} tâche(s) envoyée(s) vers Google, ${syncedFromGoogle} tâche(s) importée(s) depuis Google` });
    } catch (error) {
      console.error('Sync error:', error);
      toast({ title: "Erreur", description: "Erreur lors de la synchronisation", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tâches</h1>
              {tasks.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {completedTasks.length}/{tasks.length} complétées
                  </span>
                  <Progress value={completionRate} className="w-24 h-1.5" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {googleTasks.isConnected ? (
                <>
                  <Button onClick={() => setShowSyncDialog(true)} size="sm" variant="outline" disabled={googleTasks.isLoading} className="rounded-xl">
                    <RefreshCw className={`h-4 w-4 mr-2 ${googleTasks.isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Synchroniser</span>
                  </Button>
                  <Button onClick={googleTasks.disconnect} size="sm" variant="outline" className="rounded-xl">
                    <CloudOff className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Déconnecter</span>
                  </Button>
                </>
              ) : (
                <Button onClick={googleTasks.connectToGoogle} size="sm" variant="outline" className="rounded-xl">
                  <Cloud className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Google Tasks</span>
                </Button>
              )}
              <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouvelle tâche</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En cours ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Terminées ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <TabsContent value={activeTab} className="mt-4">
                  {currentTasks.length === 0 && !isLoading ? (
                    <PagePenguinEmpty
                      image={penguinBusy}
                      title={activeTab === "pending" ? "Pas encore de tâches" : "Aucune tâche terminée"}
                      description={activeTab === "pending" ? "Créez votre première tâche pour commencer à organiser votre journée." : "Les tâches que vous terminez apparaîtront ici."}
                    >
                      {activeTab === "pending" && (
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="rounded-xl">
                          <Plus className="h-4 w-4 mr-2" />Nouvelle tâche
                        </Button>
                      )}
                    </PagePenguinEmpty>
                  ) : (
                    <TaskList
                      tasks={currentTasks}
                      loading={isLoading}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleComplete={handleToggleComplete}
                      subtasks={subtasks}
                      onRefreshSubtasks={handleRefreshSubtasks}
                      onReorder={handleReorder}
                    />
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>

      {isCreateModalOpen && <CreateModal type="task" onSuccess={handleTaskCreated} />}
      {isEditModalOpen && (
        <EditTaskModal task={editingTask} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={handleTaskEdited} />
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
            <AlertDialogAction onClick={handleSyncWithGoogle}>Synchroniser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
