
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState as useReactState } from "react";
import TaskList from "@/components/TaskList";
import { useQuery } from "@tanstack/react-query";
import { CreateModal } from "@/components/ui/CreateModal";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useReactState(false);
  const [subtasks, setSubtasks] = useState<{ [taskId: string]: Subtask[] }>({});

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

      return (data || []).map(task => ({
        ...task,
        priority: task.priority as "low" | "medium" | "high" | null
      })) as Task[];
    },
    enabled: !!user,
  });

  // Charger les sous-tâches
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

    // Grouper les sous-tâches par task ID
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
    console.log('Edit task:', task);
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
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1">
          <div className="md:hidden">
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="pt-16 md:pt-6 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Tâches</h1>
                <CreateModal type="task" onSuccess={handleTaskCreated} />
              </div>

              <TaskList
                tasks={tasks}
                loading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
                subtasks={subtasks}
                onRefreshSubtasks={handleRefreshSubtasks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
