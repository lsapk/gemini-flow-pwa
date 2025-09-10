import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState as useReactState } from "react";
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

  return (
    <div className="space-y-6">
      <div className="pt-16 md:pt-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Tâches</h1>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
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
    </div>
  );
}
