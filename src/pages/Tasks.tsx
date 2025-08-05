import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState as useReactState } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  user_id: string;
  parent_task_id?: string | null;
  sort_order?: number;
}

interface FrequencyTab {
  id: string;
  label: string;
  count: number;
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate, onTaskDelete }) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <Card key={task.id} className="bg-card text-card-foreground shadow-md">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {task.title}
              {task.completed && <CheckCircle className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription>{task.description || 'No description'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Priority: {task.priority || 'None'}</p>
            {task.due_date && (
              <p className="text-sm text-muted-foreground">
                Due Date: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={() => onTaskUpdate(task.id, { completed: !task.completed })} variant="outline">
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
            <Button onClick={() => onTaskDelete(task.id)} variant="destructive">
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

interface FrequencyTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: FrequencyTab[];
}

const FrequencyTabs: React.FC<FrequencyTabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="inline-flex items-center rounded-md border border-input bg-background p-1 text-xs sm:text-sm">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'default' : 'ghost'}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "rounded-md px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            activeTab === tab.id ? 'bg-secondary text-secondary-foreground' : ''
          )}
        >
          {tab.label} ({tab.count})
        </Button>
      ))}
    </div>
  );
};

interface CreateModalProps { }

const CreateModal: React.FC<CreateModalProps> = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
      });
      return;
    }

    const newTask = {
      user_id: user.id,
      title: title,
      description: description,
      priority: priority,
      due_date: date ? format(date, 'yyyy-MM-dd') : null,
      completed: false,
    };

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([newTask]);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto text-sm">Créer une tâche</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Créer une tâche</DialogTitle>
            <DialogDescription className="text-sm">
              Créez une nouvelle tâche pour rester organisé.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm">Titre</Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority" className="text-sm">Priorité</Label>
              <select
                id="priority"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Date d'échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal text-sm h-9',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full text-sm">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate, onTaskDelete }) => {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <Card key={task.id} className="bg-card text-card-foreground shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-sm sm:text-base">
              {task.title}
              {task.completed && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{task.description || 'Aucune description'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pb-2">
            <p className="text-xs sm:text-sm text-muted-foreground">Priorité: {task.priority || 'Aucune'}</p>
            {task.due_date && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Échéance: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2 pt-2">
            <Button 
              onClick={() => onTaskUpdate(task.id, { completed: !task.completed })} 
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm flex-1"
            >
              {task.completed ? 'Marquer incomplète' : 'Marquer complète'}
            </Button>
            <Button 
              onClick={() => onTaskDelete(task.id)} 
              variant="destructive"
              size="sm"
              className="text-xs sm:text-sm"
            >
              Suppr.
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Gérer ouverture du menu mobile localement
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useReactState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // Cast the data to ensure type compatibility
        setTasks((data || []) as Task[]);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
        });
      }
    };

    fetchTasks();
  }, [user, toast]);

  const handleTaskUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
      );

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleTaskDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleDeleteAll = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAll = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setTasks([]);
      setIsDeleteDialogOpen(false);

      toast({
        title: 'Success',
        description: 'All tasks deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  const tasksToday = tasks.filter((task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return (
      dueDate.getFullYear() === today.getFullYear() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getDate() === today.getDate()
    );
  });

  const tasksThisWeek = tasks.filter((task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && dueDate >= today;
  });

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  });

  const filteredTasks = (() => {
    switch (activeTab) {
      case 'today':
        return tasksToday;
      case 'week':
        return tasksThisWeek;
      case 'overdue':
        return overdueTasks;
      default:
        return tasks;
    }
  })();

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
          
          <div className="pt-16 md:pt-6 px-2 sm:px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Mes Tâches</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <CreateModal />
                  <Button 
                    onClick={handleDeleteAll}
                    variant="destructive"
                    size="sm"
                    disabled={tasks.length === 0}
                    className="w-full sm:w-auto text-sm"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Tout supprimer
                  </Button>
                </div>
              </div>

              <div className="mb-4 sm:mb-6 overflow-x-auto">
                <FrequencyTabs 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab}
                  tabs={[
                    { id: 'all', label: 'Toutes', count: tasks.length },
                    { id: 'today', label: 'Aujourd\'hui', count: tasksToday.length },
                    { id: 'week', label: 'Cette semaine', count: tasksThisWeek.length },
                    { id: 'overdue', label: 'En retard', count: overdueTasks.length }
                  ]}
                />
              </div>

              <TaskList 
                tasks={filteredTasks} 
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
              />

              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Confirmer la suppression</DialogTitle>
                    <DialogDescription className="text-sm">
                      Êtes-vous sûr de vouloir supprimer toutes les tâches ? Cette action est irréversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="text-sm">
                      Annuler
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteAll} className="text-sm">
                      Supprimer tout
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
