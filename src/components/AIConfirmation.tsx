
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X } from "lucide-react";

interface AIConfirmationProps {
  type: "task" | "goal" | "habit";
  data: any;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function AIConfirmation({ type, data, onConfirm, onCancel }: AIConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case "task": return "tâche";
      case "goal": return "objectif";
      case "habit": return "habitude";
      default: return "élément";
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Confirmation requise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-orange-700">
          L'assistant IA souhaite créer la {getTypeLabel()} suivante :
        </p>
        
        <div className="bg-white p-3 rounded-md border border-orange-200">
          <h4 className="font-medium text-gray-900">{data.title}</h4>
          {data.description && (
            <p className="text-sm text-gray-600 mt-1">{data.description}</p>
          )}
          {data.priority && (
            <p className="text-xs text-gray-500 mt-2">Priorité: {data.priority}</p>
          )}
          {data.frequency && (
            <p className="text-xs text-gray-500 mt-2">Fréquence: {data.frequency}</p>
          )}
          {data.category && (
            <p className="text-xs text-gray-500 mt-2">Catégorie: {data.category}</p>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? "Création..." : "Confirmer"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isProcessing}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
