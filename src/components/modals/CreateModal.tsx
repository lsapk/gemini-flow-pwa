import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateHabitForm from "@/components/modals/CreateHabitForm";
import CreateTaskForm from "@/components/modals/CreateTaskForm";
import CreateGoalForm from "@/components/modals/CreateGoalForm";
import CreateJournalForm from "@/components/modals/CreateJournalForm";

interface CreateModalProps {
  type: 'habit' | 'task' | 'goal' | 'journal';
  onSuccess: () => void;
  parentTaskId?: string;
}

export default function CreateModal({ type, onSuccess, parentTaskId }: CreateModalProps) {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  const getTitle = () => {
    switch (type) {
      case 'habit':
        return 'Créer une nouvelle habitude';
      case 'task':
        return parentTaskId ? 'Créer une sous-tâche' : 'Créer une nouvelle tâche';
      case 'goal':
        return 'Créer un nouvel objectif';
      case 'journal':
        return 'Nouvelle entrée de journal';
      default:
        return 'Créer';
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'habit':
        return <CreateHabitForm onSuccess={onSuccess} />;
      case 'task':
        return <CreateTaskForm onSuccess={onSuccess} parentTaskId={parentTaskId} />;
      case 'goal':
        return <CreateGoalForm onSuccess={onSuccess} />;
      case 'journal':
        return <CreateJournalForm onSuccess={onSuccess} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}
