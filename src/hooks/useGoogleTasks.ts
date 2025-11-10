import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: string;
  completed?: string;
}

export function useGoogleTasks() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskListId, setTaskListId] = useState<string>("");

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("google_tasks_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setIsConnected(!!data);
  };

  const connectToGoogle = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("google-tasks-oauth", {
        body: { action: "get_auth_url" },
      });

      if (error) throw error;

      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error connecting to Google Tasks:", error);
      toast.error("Erreur de connexion à Google Tasks");
    }
  };

  const handleOAuthCallback = async (code: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke("google-tasks-oauth", {
        body: { code },
      });

      if (error) throw error;

      toast.success("Connecté à Google Tasks !");
      setIsConnected(true);
    } catch (error) {
      console.error("Error in OAuth callback:", error);
      toast.error("Erreur lors de la connexion");
    }
  };

  const disconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("google_tasks_tokens")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setIsConnected(false);
      setTasks([]);
      toast.success("Déconnecté de Google Tasks");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const loadTasks = async (listId?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-tasks-api", {
        body: {
          action: "list",
          user_id: user.id,
          task_list_id: listId || taskListId,
        },
      });

      if (error) throw error;
      setTasks(data.items || []);
      
      if (!taskListId && data.items?.[0]) {
        // Get the task list ID from the first request
        const { data: listsData } = await supabase.functions.invoke("google-tasks-api", {
          body: {
            action: "list_task_lists",
            user_id: user.id,
          },
        });
        setTaskListId(listsData?.items?.[0]?.id || "");
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Erreur de chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData: { title: string; notes?: string; due?: string }) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-tasks-api", {
        body: {
          action: "create",
          user_id: user.id,
          task_list_id: taskListId,
          task_data: taskData,
        },
      });

      if (error) throw error;
      toast.success("Tâche créée dans Google Tasks !");
      await loadTasks();
      return data?.id || null;
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Erreur de création de la tâche");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<GoogleTask>) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("google-tasks-api", {
        body: {
          action: "update",
          user_id: user.id,
          task_list_id: taskListId,
          task_id: taskId,
          task_data: taskData,
        },
      });

      if (error) throw error;
      toast.success("Tâche mise à jour !");
      await loadTasks();
      return true;
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Erreur de mise à jour");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("google-tasks-api", {
        body: {
          action: "delete",
          user_id: user.id,
          task_list_id: taskListId,
          task_id: taskId,
        },
      });

      if (error) throw error;
      toast.success("Tâche supprimée !");
      await loadTasks();
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Erreur de suppression");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    tasks,
    isLoading,
    connectToGoogle,
    handleOAuthCallback,
    disconnect,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    checkConnection,
  };
}
