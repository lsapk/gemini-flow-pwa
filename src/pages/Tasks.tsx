import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, PlusCircle, CheckSquare, AlertCircle, Clock, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  subtasks_count?: number;
  sort_order?: number;
}

import TaskList from "@/components/TaskList";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les tâches.",
          variant: "destructive",
        });
        return;
      }

      // Ajouter le comptage des sous-tâches
      const tasksWithSubtaskCount = (data || []).map(task => {
        const subtasksCount = data?.filter(t => t.parent_task_id === task.id).length || 0;
        return {
          ...task,
          priority: (task.priority as 'high' | 'medium' | 'low') || 'medium',
          subtasks_count: subtasksCount
        };
      });

      setTasks(tasksWithSubtaskCount);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        user_id: user.id,
        completed: editingTask?.completed || false,
        parent_task_id: parentTaskId,
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) throw error;
        
        toast({
          title: "Tâche modifiée",
          description: "Votre tâche a été modifiée avec succès.",
        });
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(taskData);

        if (error) throw error;
        
        toast({
          title: parentTaskId ? "Sous-tâche créée" : "Tâche créée",
          description: parentTaskId ? "Votre sous-tâche a été créée avec succès." : "Votre tâche a été créée avec succès.",
        });
      }
      
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la tâche.",
        variant: "destructive",
      });
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la tâche.",
          variant: "destructive",
        });
        return;
      }

      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !completed } : task
      ));
      
      toast({
        title: !completed ? "Tâche terminée !" : "Tâche rouverte",
        description: !completed ? "Félicitations pour avoir terminé cette tâche !" : "La tâche a été marquée comme non terminée.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
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
          title: "Erreur",
          description: "Impossible de supprimer la tâche.",
          variant: "destructive",
        });
        return;
      }

      setTasks(tasks.filter(task => task.id !== id));
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès.",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority('medium');
    setDueDate("");
    setEditingTask(null);
    setParentTaskId(null);
    setIsFormOpen(false);
  };

  const editTask = (task: Task) => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.due_date ? task.due_date.split('T')[0] : "");
    setEditingTask(task);
    setParentTaskId(null);
    setIsFormOpen(true);
  };

  const createSubTask = (taskId: string) => {
    setTitle("");
    setDescription("");
    setPriority('medium');
    setDueDate("");
    setEditingTask(null);
    setParentTaskId(taskId);
    setIsFormOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckSquare className="h-3 w-3" />;
      default: return null;
    }
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'completed': return tasks.filter(t => t.completed);
      case 'pending': return tasks.filter(t => !t.completed);
      case 'high': return tasks.filter(t => t.priority === 'high');
      default: return tasks; // Afficher TOUTES les tâches, y compris les sous-tâches
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-3 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Tâches</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsFormOpen(true)}
              size="sm"
              className="bg-[#715FFA] hover:bg-[#715FFA]/90 text-white font-semibold rounded-lg px-3 sm:px-5 py-2 flex gap-2 items-center transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle tâche</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-0 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTask 
                  ? "Modifier la tâche" 
                  : parentTaskId 
                    ? "Créer une sous-tâche" 
                    : "Nouvelle tâche"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nom de votre tâche"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description de votre tâche (optionnel)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Élevée</SelectItem>
                    <SelectItem value="medium">🟡 Moyenne</SelectItem>
                    <SelectItem value="low">🟢 Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Date d'échéance</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingTask ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3">
        {/* Total */}
        <Card className="flex h-auto px-2 py-2 sm:p-4 items-center transition-shadow">
          <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-blue-100">
              <CheckSquare className="text-blue-600 w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <div className="font-semibold text-xs sm:text-base text-blue-800 truncate">
                Total
              </div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">
                {tasks.filter(t => !t.parent_task_id).length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terminées */}
        <Card className="flex h-auto px-2 py-2 sm:p-4 items-center transition-shadow">
          <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-green-100">
              <span className="text-base sm:text-2xl">✅</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <div className="font-semibold text-xs sm:text-base text-green-800 truncate">
                Terminées
              </div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">
                {tasks.filter(t => t.completed).length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* En cours */}
        <Card className="flex h-auto px-2 py-2 sm:p-4 items-center transition-shadow">
          <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-orange-100">
              <Clock className="text-orange-600 w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <div className="font-semibold text-xs sm:text-base text-orange-800 truncate">
                En cours
              </div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">
                {tasks.filter(t => !t.completed && !t.parent_task_id).length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priorité haute */}
        <Card className="flex h-auto px-2 py-2 sm:p-4 items-center transition-shadow">
          <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-red-100">
              <AlertCircle className="text-red-600 w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <div className="font-semibold text-xs sm:text-base text-red-800 truncate">
                Urgentes
              </div>
              <div className="text-[10px] sm:text-sm text-muted-foreground">
                {tasks.filter(t => t.priority === 'high' && !t.completed).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Toutes ({tasks.length})</span>
            <span className="sm:hidden">Toutes</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">En cours ({tasks.filter(t => !t.completed).length})</span>
            <span className="sm:hidden">En cours</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Terminées ({tasks.filter(t => t.completed).length})</span>
            <span className="sm:hidden">Terminées</span>
          </TabsTrigger>
          <TabsTrigger value="high" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Urgentes ({tasks.filter(t => t.priority === 'high').length})</span>
            <span className="sm:hidden">Urgentes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Vos tâches</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TaskList
                tasks={filteredTasks}
                loading={loading}
                onEdit={editTask}
                onDelete={deleteTask}
                onToggleComplete={toggleComplete}
                onRefresh={fetchTasks}
                onCreateSubTask={createSubTask}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
