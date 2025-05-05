
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, CheckCircle2, Pencil, PlusCircle, Flag as Priority, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "@/lib/api";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiResponse, ApiSuccessResponse } from "@/types/models";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await getTasks(user.id) as ApiResponse<Task[]>;
        if (response.error) {
          throw new Error(response.error);
        }
        setTasks(response.data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load tasks.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, toast]);

  const handleCreateTask = async () => {
    if (!newTask.trim() || !user) return;

    try {
      const response = await createTask(user.id, {
        title: newTask,
        completed: false,
        due_date: date ? format(date, "yyyy-MM-dd") : undefined,
        priority: selectedPriority,
      }) as ApiResponse<Task>;

      if (response.error) {
        throw new Error(response.error);
      }

      setTasks([...tasks, response.data]);
      setNewTask("");
      setDate(undefined);
      setSelectedPriority("");
      toast({
        title: "Success",
        description: "Task created successfully.",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (task: Task, completed: boolean) => {
    if (!user) return;
    try {
      const response = await updateTask(task.id, { completed }) as ApiResponse<Task>;
      if (response.error) {
        throw new Error(response.error);
      }

      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, completed } : t
        )
      );
      toast({
        title: "Success",
        description: `Task ${completed ? "completed" : "uncompleted"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!user) return;
    try {
      const response = await deleteTask(task.id) as ApiSuccessResponse;
      if (response.error) {
        throw new Error(response.error);
      }

      setTasks(tasks.filter((t) => t.id !== task.id));
      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  const priorities = [
    {
      value: "low",
      label: "Low",
    },
    {
      value: "medium",
      label: "Medium",
    },
    {
      value: "high",
      label: "High",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage your tasks efficiently.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    {selectedPriority
                      ? priorities.find((priority) => priority.value === selectedPriority)?.label
                      : "Priority"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No priority found.</CommandEmpty>
                      <CommandGroup>
                        {priorities.map((priority) => (
                          <CommandItem
                            key={priority.value}
                            onSelect={() => {
                              setSelectedPriority(priority.value);
                            }}
                          >
                            {priority.label}
                            <CheckCircle2
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedPriority === priority.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button onClick={handleCreateTask}>Add Task</Button>
            </div>
            <ScrollArea>
              <Table>
                <TableCaption>A list of your tasks.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Completed</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No tasks found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              handleUpdateTask(task, !!checked);
                            }}
                          />
                        </TableCell>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          {task.due_date ? format(new Date(task.due_date), "PPP") : "No Due Date"}
                        </TableCell>
                        <TableCell>
                          {task.priority ? (
                            <Badge variant="secondary">{task.priority}</Badge>
                          ) : (
                            "No Priority"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
