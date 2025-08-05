
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, Trash2, Edit, Plus } from "lucide-react";
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
  priority: "low" | "medium" | "high" | null;
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

const TaskCard = ({ task, onTaskUpdate, onTaskDelete }: { 
  task: Task; 
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
}) => {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 text-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <button 
              onClick={() => onTaskUpdate(task.id, { completed: !task.completed })}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                task.completed 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'border-gray-500 hover:border-blue-500'
              }`}
            >
              {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1">
              <h3 className={`font-medium text-white mb-1 ${task.completed ? 'line-through opacity-60' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-400 mb-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: implement edit */}}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTaskDelete(task.id)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.priority && (
              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
            {task.due_date && (
              <span className="text-xs text-gray-400">
                Échéance: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <button className="text-gray-400 hover:text-white">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Ajouter une sous-tâche</span>
          </button>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-800">
          <span className="text-xs text-gray-500">
            création: {new Date(task.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

interface FrequencyTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: FrequencyTab[];
}

const FrequencyTabs: React.FC<FrequencyTabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="flex gap-1 bg-gray-900/50 p-1 rounded-lg">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'default' : 'ghost'}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 text-sm py-2 px-3 rounded-md transition-colors",
            activeTab === tab.id 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDate(undefined);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle tâche
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Créer une tâche</DialogTitle>
            <DialogDescription className="text-gray-400">
              Créez une nouvelle tâche pour rester organisé.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-white">Titre</Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority" className="text-white">Priorité</Label>
              <select
                id="priority"
                className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-white"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label className="text-white">Date d'échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white',
                      !date && 'text-gray-400'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
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
        setTasks((data || []).map(task => ({
          ...task,
          priority: task.priority as "low" | "medium" | "high" | null
        })) as Task[]);
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

  const pendingTasks = tasks.filter(task => !task.completed);
  const allTasks = tasks;
  const completedTasks = tasks.filter(task => task.completed);
  const urgentTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate <= today && !task.completed;
  });

  const filteredTasks = (() => {
    switch (activeTab) {
      case 'pending':
        return pendingTasks;
      case 'all':
        return allTasks;
      case 'completed':
        return completedTasks;
      case 'urgent':
        return urgentTasks;
      default:
        return pendingTasks;
    }
  })();

  return (
    <div className="min-h-screen bg-black">
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
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Tâches</h1>
                <CreateModal />
              </div>

              <div className="mb-6">
                <FrequencyTabs 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab}
                  tabs={[
                    { id: 'pending', label: 'En cours', count: pendingTasks.length },
                    { id: 'all', label: 'Toutes', count: allTasks.length },
                    { id: 'completed', label: 'Terminées', count: completedTasks.length },
                    { id: 'urgent', label: 'Urgentes', count: urgentTasks.length }
                  ]}
                />
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-white mb-2">Vos tâches</h2>
                  <p className="text-gray-400">Aucune tâche pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                    />
                  ))}
                </div>
              )}

              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Confirmer la suppression</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Êtes-vous sûr de vouloir supprimer toutes les tâches ? Cette action est irréversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteAll}>
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
