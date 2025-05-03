
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListTodoIcon } from "@/components/icons/DeepFlowIcons";

const Tasks = () => {
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Préparer la présentation", completed: false },
    { id: 2, title: "Répondre aux emails", completed: true },
    { id: 3, title: "Planifier la réunion d'équipe", completed: false },
  ]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now(), title: newTask.trim(), completed: false },
      ]);
      setNewTask("");
    }
  };

  const toggleTaskCompletion = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListTodoIcon className="h-8 w-8" />
          Gestion de tâches
        </h1>
        <p className="text-muted-foreground">
          Organisez vos tâches et suivez votre progression.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Ajouter une tâche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Nouvelle tâche..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-grow"
            />
            <Button onClick={handleAddTask}>Ajouter</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent"
              >
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                />
                <Label
                  htmlFor={`task-${task.id}`}
                  className={`flex-grow cursor-pointer ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </Label>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Aucune tâche pour le moment. Ajoutez-en une !
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
