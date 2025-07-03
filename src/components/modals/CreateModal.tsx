
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateModal as BaseCreateModal } from "@/components/ui/CreateModal";
import CreateGoalForm from "./CreateGoalForm";
import CreateHabitForm from "./CreateHabitForm";
import CreateTaskForm from "./CreateTaskForm";

interface CreateModalProps {
  type: "goal" | "habit" | "task";
  onSuccess: () => void;
  variant?: "default" | "outline";
  children?: React.ReactNode;
}

export default function CreateModal({ type, onSuccess, variant = "default", children }: CreateModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getTitle = () => {
    switch (type) {
      case "goal":
        return "Créer un objectif";
      case "habit":
        return "Créer une habitude";
      case "task":
        return "Créer une tâche";
      default:
        return "Créer";
    }
  };

  const getFormComponent = () => {
    const props = { onSuccess: handleSuccess };
    
    switch (type) {
      case "goal":
        return <CreateGoalForm {...props} />;
      case "habit":
        return <CreateHabitForm {...props} />;
      case "task":
        return <CreateTaskForm {...props} />;
      default:
        return null;
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess();
  };

  const handleClose = () => {
    setIsOpen(false);
    onSuccess();
  };

  return (
    <BaseCreateModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
    >
      {getFormComponent()}
    </BaseCreateModal>
  );
}
