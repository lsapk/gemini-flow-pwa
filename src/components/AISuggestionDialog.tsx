
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X, Target, CheckSquare, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AISuggestion {
  type: "task" | "goal" | "habit";
  title: string;
  description?: string;
  priority?: string;
  frequency?: string;
  category?: string;
  reasoning: string;
}

interface AISuggestionDialogProps {
  suggestion: AISuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AISuggestionDialog({ 
  suggestion, 
  isOpen, 
  onClose, 
  onConfirm 
}: AISuggestionDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  if (!suggestion) return null;

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case "task": return <CheckSquare className="h-5 w-5" />;
      case "goal": return <Target className="h-5 w-5" />;
      case "habit": return <Repeat className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (suggestion.type) {
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
      let result;
      
      if (suggestion.type === "task") {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: suggestion.title,
            description: suggestion.description || null,
            priority: suggestion.priority || 'medium',
            completed: false
          });
        if (error) throw error;
        result = "Tâche créée avec succès !";
      } else if (suggestion.type === "habit") {
        const { error } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            title: suggestion.title,
            description: suggestion.description || null,
            frequency: suggestion.frequency || 'daily',
            target: 1,
            streak: 0
          });
        if (error) throw error;
        result = "Habitude créée avec succès !";
      } else if (suggestion.type === "goal") {
        const { error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            title: suggestion.title,
            description: suggestion.description || null,
            category: suggestion.category || 'personal',
            progress: 0,
            completed: false
          });
        if (error) throw error;
        result = "Objectif créé avec succès !";
      }

      toast.success(result);
      onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800">
            {getTypeIcon()}
            Suggestion IA
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-blue-700">
            Je suggère de créer cette {getTypeLabel()} :
          </p>
          
          <div className="bg-white p-4 rounded-md border border-blue-200">
            <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
            {suggestion.description && (
              <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
            )}
            
            <div className="mt-3 space-y-1">
              {suggestion.priority && (
                <p className="text-xs text-gray-500">Priorité: {suggestion.priority}</p>
              )}
              {suggestion.frequency && (
                <p className="text-xs text-gray-500">Fréquence: {suggestion.frequency}</p>
              )}
              {suggestion.category && (
                <p className="text-xs text-gray-500">Catégorie: {suggestion.category}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Pourquoi cette suggestion ?</strong><br />
              {suggestion.reasoning}
            </p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? "Création..." : "Créer"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Ignorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
