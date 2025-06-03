import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CreateModal from "@/components/modals/CreateModal";

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
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Error",
          description: "Failed to fetch tasks.",
          variant: "destructive",
        });
        return;
      }

      // Type assertion to handle the priority field
      setTasks((data || []).map(task => ({
        ...task,
        priority: (task.priority as 'high' | 'medium' | 'low') || 'medium'
      })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Error",
          description: "Failed to update task.",
          variant: "destructive",
        });
        return;
      }

      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !completed } : task
      ));
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting task:", error);
        toast({
          title: "Error",
          description: "Failed to delete task.",
          variant: "destructive",
        });
        return;
      }

      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tâches</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Organisez et suivez vos tâches quotidiennes
          </p>
        </div>
        
        <CreateModal
          type="task"
          onSuccess={fetchTasks}
        />
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">{tasks.length}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">📋</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Terminées</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">
                  {tasks.filter(t => t.completed).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-600">En cours</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-900">
                  {tasks.filter(t => !t.completed).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-600">Urgent</p>
                <p className="text-xl sm:text-2xl font-bold text-red-900">
                  {tasks.filter(t => t.priority === 'high' && !t.completed).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-2xl">🔥</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des tâches</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-4">
              Aucune tâche pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map(task => (
                <div key={task.id} className="py-2 flex items-center justify-between">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id, task.completed)}
                        className="h-5 w-5 rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span>{task.title}</span>
                    </label>
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
