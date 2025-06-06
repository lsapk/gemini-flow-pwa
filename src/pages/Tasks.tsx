
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
import { PlusCircle, CheckSquare, AlertCircle, Clock, Edit, Trash2 } from "lucide-react";
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
}

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

      setTasks((data || []).map(task => ({
        ...task,
        priority: (task.priority as 'high' | 'medium' | 'low') || 'medium'
      })));
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
          title: "Tâche créée",
          description: "Votre tâche a été créée avec succès.",
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
    setIsFormOpen(false);
  };

  const editTask = (task: Task) => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.due_date ? task.due_date.split('T')[0] : "");
    setEditingTask(task);
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
      default: return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tâches</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Organisez et suivez vos tâches quotidiennes
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-0 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">{tasks.length}</p>
              </div>
              <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
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
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl">✅</span>
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
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-600">Priorité haute</p>
                <p className="text-xl sm:text-2xl font-bold text-red-900">
                  {tasks.filter(t => t.priority === 'high' && !t.completed).length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toutes ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">En cours ({tasks.filter(t => !t.completed).length})</TabsTrigger>
          <TabsTrigger value="completed">Terminées ({tasks.filter(t => t.completed).length})</TabsTrigger>
          <TabsTrigger value="high">Urgentes ({tasks.filter(t => t.priority === 'high').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos tâches</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre première tâche
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer une tâche
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className={`border rounded-lg p-4 space-y-3 ${task.completed ? 'bg-gray-50 opacity-75' : ''}`}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleComplete(task.id, task.completed)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </h3>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          <div className="flex gap-2 mb-2">
                            <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1`}>
                              {getPriorityIcon(task.priority)}
                              {task.priority}
                            </Badge>
                            {task.due_date && (
                              <Badge variant="outline">
                                Échéance: {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
                              </Badge>
                            )}
                          </div>
                          {task.created_at && (
                            <p className="text-xs text-muted-foreground">
                              Créée le {format(new Date(task.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
