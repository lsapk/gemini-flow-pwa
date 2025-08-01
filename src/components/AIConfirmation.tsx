
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AIConfirmationProps {
  type: "task" | "goal" | "habit";
  data: any;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function AIConfirmation({ type, data, onConfirm, onCancel }: AIConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const getTypeLabel = () => {
    switch (type) {
      case "task": return "tâche";
      case "goal": return "objectif";
      case "habit": return "habitude";
      default: return "élément";
    }
  };

  const handleConfirm = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // Créer l'élément dans la base de données selon le type
      let result;
      
      if (type === "task") {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description || null,
            priority: data.priority || 'medium',
            due_date: data.due_date || null,
            completed: false
          });
        if (error) throw error;
        result = "Tâche créée avec succès !";
      } else if (type === "habit") {
        const { error } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description || null,
            frequency: data.frequency || 'daily',
            category: data.category || null,
            target: data.target || 1,
            streak: 0
          });
        if (error) throw error;
        result = "Habitude créée avec succès !";
      } else if (type === "goal") {
        const { error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description || null,
            category: data.category || 'personal',
            target_date: data.target_date || null,
            progress: 0,
            completed: false
          });
        if (error) throw error;
        result = "Objectif créé avec succès !";
      }

      toast.success(result);
      await onConfirm();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création');
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
