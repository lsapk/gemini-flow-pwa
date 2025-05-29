
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, isBefore, parseISO, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ListTodo, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type TaskInput = {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
};

const priorityColors: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "default",
};

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState<TaskInput>({
    title: "",
    description: "",
    priority: "medium",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const todayStart = startOfToday();

  // Filtrer les tâches
  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        !task.completed &&
        task.due_date &&
        isBefore(parseISO(task.due_date), todayStart)
    );
  }, [tasks, todayStart]);

  const todayTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        !task.completed &&
        task.due_date &&
        format(parseISO(task.due_date), "yyyy-MM-dd") ===
          format(todayStart, "yyyy-MM-dd")
    );
  }, [tasks, todayStart]);

  const upcomingTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        !task.completed &&
        (!task.due_date ||
          (task.due_date &&
            !isBefore(parseISO(task.due_date), todayStart) &&
            format(parseISO(task.due_date), "yyyy-MM-dd") !==
              format(todayStart, "yyyy-MM-dd")))
    );
  }, [tasks, todayStart]);

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.completed);
  }, [tasks]);

  // Charger les tâches au chargement du composant
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Récupérer les tâches depuis Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des tâches:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle tâche
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Préparer l'objet à insérer avec la date d'échéance formatée
      const taskToInsert = {
        ...newTask,
        user_id: user?.id,
        due_date: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss'Z'") : null,
        completed: false
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert([taskToInsert])
        .select();

      if (error) throw error;

      if (data) {
        setTasks((prev) => [...prev, data[0]]);
        setNewTask({ title: "", description: "", priority: "medium" });
        setSelectedDate(undefined);
        setDialogOpen(false);
        toast({
          title: "Succès",
          description: "Tâche ajoutée avec succès.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la tâche.",
        variant: "destructive",
      });
    }
  };

  // Marquer une tâche comme terminée ou non terminée
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="h-8 w-8 text-primary" />
            Tâches
          </h1>
          <p className="text-muted-foreground">
            Gérez vos tâches quotidiennes et suivez votre progression.
          </p>
        </div>

        {/* Bouton pour ajouter une nouvelle tâche */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Nouvelle tâche</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle tâche à votre liste.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Entrez le titre de la tâche..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Textarea
                  id="description"
                  placeholder="Entrez une description..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Sélectionnez la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due-date">Date d'échéance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="due-date"
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "dd MMMM yyyy", { locale: fr })
                        ) : (
                          <span className="text-muted-foreground">Sélectionnez une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Ajouter la tâche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-4 bg-muted w-full justify-start overflow-auto">
          <TabsTrigger value="today" className="px-4 py-2">Aujourd'hui</TabsTrigger>
          <TabsTrigger value="overdue" className="px-4 py-2 flex items-center">
            En retard {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="px-4 py-2">À venir</TabsTrigger>
          <TabsTrigger value="completed" className="px-4 py-2">Terminées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today">
          <Card className="shadow-md bg-card">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-xl font-semibold text-primary">Tâches d'aujourd'hui</CardTitle>
              <CardDescription>
                Les tâches prévues pour aujourd'hui.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {renderTaskList(todayTasks, "Aucune tâche pour aujourd'hui.")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card className="shadow-md bg-card">
            <CardHeader className="bg-destructive/5 pb-2">
              <CardTitle className="text-xl font-semibold text-destructive">Tâches en retard</CardTitle>
              <CardDescription>
                Les tâches dont l'échéance est dépassée.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {renderTaskList(overdueTasks, "Aucune tâche en retard.")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card className="shadow-md bg-card">
            <CardHeader className="bg-secondary/5 pb-2">
              <CardTitle className="text-xl font-semibold text-secondary">Tâches à venir</CardTitle>
              <CardDescription>
                Les tâches à venir dans les prochains jours.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {renderTaskList(upcomingTasks, "Aucune tâche à venir.")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="shadow-md bg-card">
            <CardHeader className="bg-success/5 pb-2">
              <CardTitle className="text-xl font-semibold text-green-600">Tâches terminées</CardTitle>
              <CardDescription>
                Les tâches que vous avez déjà accomplies.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {renderTaskList(completedTasks, "Aucune tâche terminée.")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
  
  // Rendu d'une liste de tâches
  function renderTaskList(taskList: Task[], emptyMessage: string) {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-16 flex-1" />
            </div>
          ))}
        </div>
      );
    }

    if (taskList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
          <ListTodo className="h-12 w-12 mb-3 text-muted" />
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map((task) => (
          <div key={task.id} 
            className={cn("flex items-start space-x-3 p-3 rounded-lg transition-colors border",
              task.completed ? "border-muted bg-muted/20" : "border-primary/10 bg-card hover:bg-muted/30")}>
            <Checkbox
              checked={task.completed}
              onCheckedChange={(value) =>
                toggleTaskCompletion(task.id, value === true)
              }
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    "font-medium",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {task.description && (
                <p className={cn("text-sm text-muted-foreground", 
                  task.completed && "line-through text-muted-foreground/70")}>
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {task.priority && (
                  <Badge variant={priorityColors[task.priority as keyof typeof priorityColors] || "default"}
                        className="font-normal">
                    {task.priority === "high"
                      ? "Élevée"
                      : task.priority === "medium"
                      ? "Moyenne"
                      : "Faible"}
                  </Badge>
                )}
                {task.due_date && (
                  <span className={cn("text-muted-foreground flex items-center gap-1 bg-background/80 px-2 py-1 rounded-full",
                    task.completed && "line-through")}>
                    <CalendarIcon className="h-3 w-3" />
                    {format(parseISO(task.due_date), "dd MMMM yyyy", { locale: fr })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default Tasks;
