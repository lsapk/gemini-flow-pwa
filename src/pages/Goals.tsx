import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ListTodoIcon } from "@/components/icons/DeepFlowIcons";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Flag, Pencil, PlusCircle, Trash2, Calendar as CalendarIcon2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// Task priorities
const priorityOptions = [
  { value: "high", label: "Haute", badge: "bg-red-500" },
  { value: "medium", label: "Moyenne", badge: "bg-amber-500" },
  { value: "low", label: "Basse", badge: "bg-green-500" }
];

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
  user_id: string;
  created_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  due_date: Date | undefined;
  priority: string;
}

const TasksEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <ListTodoIcon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
    <p className="text-muted-foreground mb-4">
      Commencez par créer votre première tâche pour suivre votre productivité.
    </p>
    <Button onClick={onCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Nouvelle tâche
    </Button>
  </div>
);

const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  
  const priorityOption = priorityOptions.find((option) => option.value === priority);
  
  return (
    <Badge 
      variant="outline" 
      className={`border-none ${priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : 
        priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
    >
      <div className={`w-2 h-2 rounded-full mr-1.5 ${
        priority === "high" ? "bg-red-500" :
        priority === "medium" ? "bg-amber-500" :
        "bg-green-500"
      }`}></div>
      {priorityOption?.label || ""}
    </Badge>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    due_date: undefined,
    priority: "",
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
      const { data, error } = await getTasks();
      
      if (error) throw new Error(error.message);
      
      setTasks(data || []);
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
        description: "Veuillez saisir un titre pour votre tâche.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newTask = {
        title: formData.title,
        description: formData.description,
        completed: false,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
        priority: formData.priority || null,
        user_id: user.id,
      };
      
      const { data, error } = await createTask(newTask);
      
      if (error) throw new Error(error.message);
      
      setTasks([...(data ? [data] : []), ...tasks]);
      
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
        description: "Veuillez saisir un titre pour votre tâche.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedTask = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
        priority: formData.priority || null,
      };
      
      const { data, error } = await updateTask(editingTask.id, updatedTask);
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setTasks(tasks.map((task) => (task.id === editingTask.id ? data : task)));
      }
      
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
      const { error } = await deleteTask(id);
      
      if (error) throw new Error(error.message);
      
      setTasks(tasks.filter((task) => task.id !== id));
      
      toast({
        title: "Tâche supprimée",
        description: "Votre tâche a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
      console.error("Error deleting task:", error);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const { data, error } = await updateTask(task.id, {
        completed: !task.completed
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setTasks(tasks.map((t) => (t.id === task.id ? data : t)));
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'état de la tâche.",
        variant: "destructive",
      });
      console.error("Error toggling task completion:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: undefined,
      priority: "",
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? parseISO(task.due_date) : undefined,
      priority: task.priority || "",
    });
    setOpenDialog(true);
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "today") {
      return task.due_date && isToday(parseISO(task.due_date));
    }
    if (activeTab === "completed") return task.completed;
    if (activeTab === "pending") return !task.completed;
    if (activeTab === "overdue") {
      return task.due_date && !task.completed && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
    }
    return true;
  });
  
  // Task counts
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.filter((task) => !task.completed).length;
  const todayCount = tasks.filter((task) => task.due_date && isToday(parseISO(task.due_date))).length;
  const overdueCount = tasks.filter((task) => 
    task.due_date && !task.completed && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ListTodoIcon className="h-8 w-8" />
            Gestion de tâches
          </h1>
          <p className="text-muted-foreground">
            Organisez vos tâches et suivez votre progression.
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
                  : "Créez une nouvelle tâche pour suivre votre progression."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Qu'est-ce qui doit être fait ?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ajoutez des détails supplémentaires..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              option.value === "high" ? "bg-red-500" :
                              option.value === "medium" ? "bg-amber-500" :
                              "bg-green-500"
                            }`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Échéance</Label>
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

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Ajouter une tâche rapide</CardTitle>
          <CardDescription>Ajoutez rapidement une nouvelle tâche à votre liste.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (formData.title) {
                handleCreateTask();
              }
            }}
            className="flex space-x-2"
          >
            <Input
              placeholder="Nouvelle tâche..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="flex-grow"
            />
            <Button type="submit" disabled={!formData.title}>Ajouter</Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid grid-cols-5 max-w-lg mx-auto">
          <TabsTrigger value="all">
            Toutes ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="today">
            Aujourd'hui ({todayCount})
          </TabsTrigger>
          <TabsTrigger value="pending">
            À faire ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Complétées ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="overdue" className={overdueCount > 0 ? "text-red-500" : ""}>
            En retard ({overdueCount})
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "all" ? "Toutes les tâches" :
               activeTab === "today" ? "Tâches d'aujourd'hui" :
               activeTab === "pending" ? "Tâches à faire" :
               activeTab === "completed" ? "Tâches complétées" :
               "Tâches en retard"}
            </CardTitle>
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
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-1">
                {filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-md ${
                      task.completed 
                        ? "bg-muted/40" 
                        : task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))
                        ? "bg-red-50 dark:bg-red-950/20" 
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox 
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task)}
                      />
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={`font-medium ${
                            task.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </Label>
                        
                        {task.description && (
                          <p className={`text-sm text-muted-foreground ${
                            task.completed ? "line-through" : ""
                          }`}>
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {task.due_date && (
                            <Badge 
                              variant="outline" 
                              className={`flex items-center space-x-1 text-xs ${
                                isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && !task.completed
                                  ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                                  : "border-muted bg-muted/50"
                              }`}
                            >
                              <CalendarIcon2 className="h-3 w-3" />
                              <span>{format(parseISO(task.due_date), "dd/MM/yyyy", { locale: fr })}</span>
                            </Badge>
                          )}
                          
                          {task.priority && (
                            <PriorityBadge priority={task.priority} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
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
                  </div>
                ))}
              </div>
            ) : (
              <TasksEmptyState onCreate={() => setOpenDialog(true)} />
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Tasks;
