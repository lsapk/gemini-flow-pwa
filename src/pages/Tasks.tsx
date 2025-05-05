import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Pencil, PlusCircle, Priority, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO } from 'date-fns';
import { Task, ApiResponse, ApiSuccessResponse } from "@/types/models";

interface TaskFormData {
  title: string;
  description?: string;
  due_date?: Date | null;
  priority?: string;
}

const TasksEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <CheckCircle2 className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
    <p className="text-muted-foreground mb-4">
      Commencez à organiser votre journée en créant votre première tâche.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle tâche
    </Button>
  </div>
);

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    due_date: null,
    priority: "low",
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await getTasks() as ApiResponse<Task[]>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setTasks(response.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos tâches.",
        variant: "destructive",
      });
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!user) return;
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un titre pour la tâche.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newTask = {
        title: formData.title,
        description: formData.description,
        completed: false,
        due_date: formData.due_date ? formData.due_date.toISOString() : undefined,
        priority: formData.priority,
        user_id: user.id,
      };
      
      const response = await createTask(newTask) as ApiResponse<Task>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setTasks([response.data, ...tasks]);
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Tâche créée",
        description: "Votre nouvelle tâche a été créée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTask = async () => {
    if (!user || !editingTask) return;
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un titre pour la tâche.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedTask = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
        priority: formData.priority,
      };
      
      const response = await updateTask(editingTask.id, updatedTask) as ApiResponse<Task>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setTasks(tasks.map((task) => (task.id === editingTask.id ? response.data : task)));
      
      resetForm();
      setOpenDialog(false);
      
      toast({
        title: "Tâche mise à jour",
        description: "Votre tâche a été mise à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await deleteTask(id) as ApiSuccessResponse;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.success) {
        setTasks(tasks.filter((task) => task.id !== id));
        
        toast({
          title: "Tâche supprimée",
          description: "Votre tâche a été supprimée avec succès.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
      console.error("Error deleting task:", error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedData = {
        completed: !task.completed,
      };
      
      const response = await updateTask(task.id, updatedData) as ApiResponse<Task>;
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setTasks(tasks.map((t) => (t.id === task.id ? response.data : t)));
      
      toast({
        title: task.completed ? "Tâche non complétée" : "Tâche complétée",
        description: `La tâche "${task.title}" a été marquée comme ${
          task.completed ? "non complétée" : "complétée"
        }.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la tâche.",
        variant: "destructive",
      });
      console.error("Error toggling task completion:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: null,
      priority: "low",
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? parseISO(task.due_date) : null,
      priority: task.priority || "low",
    });
    setOpenDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-8 w-8" />
            Tâches
          </h1>
          <p className="text-muted-foreground">
            Organisez votre journée et suivez vos progrès.
          </p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Modifiez les détails de votre tâche."
                  : "Créez une nouvelle tâche pour organiser votre journée."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de la tâche..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la tâche..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Date d'échéance</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? (
                        format(formData.due_date, "P", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => setFormData({ ...formData, due_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={formData.priority === "low" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, priority: "low" })}
                  >
                    Basse
                  </Button>
                  <Button
                    variant={formData.priority === "medium" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, priority: "medium" })}
                  >
                    Moyenne
                  </Button>
                  <Button
                    variant={formData.priority === "high" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, priority: "high" })}
                  >
                    Haute
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm();
                setOpenDialog(false);
              }}>
                Annuler
              </Button>
              <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
                {editingTask ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos tâches</CardTitle>
          <CardDescription>
            Suivez vos tâches et organisez votre journée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-md">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="glass-card">
                  <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(task)}
                      />
                      <Label htmlFor={`task-${task.id}`} className="font-semibold">
                        {task.title}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {task.priority && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Priority className="h-3 w-3" />
                          <span>{task.priority}</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(parseISO(task.due_date), "dd/MM/yyyy", { locale: fr })}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action ne peut pas être annulée. Cela supprimera définitivement cette tâche.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <TasksEmptyState onCreate={() => setOpenDialog(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
