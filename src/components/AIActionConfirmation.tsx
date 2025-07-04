
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Target, Repeat, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { aiActionsService, PendingAIAction } from "@/services/aiActionsService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AIActionConfirmationProps {
  actions: PendingAIAction[];
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'task': return <CheckCircle className="h-4 w-4" />;
    case 'habit': return <Repeat className="h-4 w-4" />;
    case 'goal': return <Target className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'task': return 'bg-blue-100 text-blue-800';
    case 'habit': return 'bg-purple-100 text-purple-800';
    case 'goal': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'task': return 'Tâche';
    case 'habit': return 'Habitude';
    case 'goal': return 'Objectif';
    default: return 'Élément';
  }
};

export default function AIActionConfirmation({
  actions,
  onConfirm,
  onCancel,
  loading = false
}: AIActionConfirmationProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>(
    actions.map(action => action.id)
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const handleConfirmClick = () => {
    if (selectedActions.length === 0) return;
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = async () => {
    setIsConfirming(true);
    setShowConfirmDialog(false);
    
    try {
      await aiActionsService.confirmActions(selectedActions);
      toast.success(`${selectedActions.length} élément${selectedActions.length > 1 ? 's' : ''} créé${selectedActions.length > 1 ? 's' : ''} avec succès !`);
      onConfirm();
    } catch (error) {
      console.error('Error confirming actions:', error);
      toast.error('Erreur lors de la création des éléments');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    await aiActionsService.cancelActions();
    onCancel();
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Confirmer les actions de l'assistant
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            L'assistant souhaite créer les éléments suivants. Sélectionnez ceux que vous souhaitez créer :
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-3">
            {actions.map((action) => (
              <Card 
                key={action.id} 
                className={`cursor-pointer transition-colors ${
                  selectedActions.includes(action.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleAction(action.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action.id)}
                        onChange={() => toggleAction(action.id)}
                        className="rounded border-gray-300"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getTypeColor(action.type)}>
                          {getTypeIcon(action.type)}
                          {getTypeLabel(action.type)}
                        </Badge>
                        <h3 className="font-medium break-words">{action.title}</h3>
                      </div>
                      
                      {action.description && (
                        <p className="text-sm text-muted-foreground break-words">
                          {action.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {action.priority && (
                          <Badge variant="outline">
                            Priorité: {action.priority}
                          </Badge>
                        )}
                        {action.due_date && (
                          <Badge variant="outline">
                            Échéance: {format(new Date(action.due_date), "dd MMM yyyy", { locale: fr })}
                          </Badge>
                        )}
                        {action.category && (
                          <Badge variant="outline">
                            Catégorie: {action.category}
                          </Badge>
                        )}
                        {action.frequency && (
                          <Badge variant="outline">
                            Fréquence: {action.frequency}
                          </Badge>
                        )}
                        {action.target && (
                          <Badge variant="outline">
                            Objectif: {action.target}
                          </Badge>
                        )}
                        {action.target_date && (
                          <Badge variant="outline">
                            Date cible: {format(new Date(action.target_date), "dd MMM yyyy", { locale: fr })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirmClick}
              disabled={selectedActions.length === 0 || loading || isConfirming}
              className="flex-1"
            >
              {isConfirming ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Créer {selectedActions.length} élément{selectedActions.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading || isConfirming}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation finale */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Voulez-vous vraiment créer ces éléments ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de créer {selectedActions.length} élément{selectedActions.length > 1 ? 's' : ''}.
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm}>
              Oui, créer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
