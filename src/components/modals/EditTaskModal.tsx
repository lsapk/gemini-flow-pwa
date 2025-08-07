
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateTaskForm from "./CreateTaskForm";

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

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTaskModal({ task, isOpen, onClose, onSuccess }: EditTaskModalProps) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Modifier la tâche</DialogTitle>
        </DialogHeader>
        <CreateTaskForm 
          onSuccess={handleSuccess}
          task={task}
        />
      </DialogContent>
    </Dialog>
  );
}
