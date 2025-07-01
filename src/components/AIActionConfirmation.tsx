
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Target, Repeat, BookOpen } from 'lucide-react';

interface PendingAction {
  id: string;
  action_type: string;
  action_data: any;
  created_at: string;
  expires_at: string;
}

interface AIActionConfirmationProps {
  actions: PendingAction[];
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'create_task':
      return CheckCircle;
    case 'create_habit':
      return Repeat;
    case 'create_goal':
      return Target;
    case 'create_journal':
      return BookOpen;
    default:
      return Clock;
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case 'create_task':
      return 'Créer une tâche';
    case 'create_habit':
      return 'Créer une habitude';
    case 'create_goal':
      return 'Créer un objectif';
    case 'create_journal':
      return 'Créer une entrée de journal';
    default:
      return 'Action inconnue';
  }
};

export const AIActionConfirmation: React.FC<AIActionConfirmationProps> = ({
  actions,
  onConfirm,
  onReject
}) => {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const Icon = getActionIcon(action.action_type);
        const label = getActionLabel(action.action_type);
        
        return (
          <Card key={action.id} className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4" />
                {label}
                <Badge variant="secondary">Confirmation requise</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p><strong>Titre :</strong> {action.action_data.title}</p>
                {action.action_data.description && (
                  <p><strong>Description :</strong> {action.action_data.description}</p>
                )}
                {action.action_data.priority && (
                  <p><strong>Priorité :</strong> {action.action_data.priority}</p>
                )}
                {action.action_data.category && (
                  <p><strong>Catégorie :</strong> {action.action_data.category}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onConfirm(action.id)}
                  className="flex-1"
                >
                  Confirmer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(action.id)}
                  className="flex-1"
                >
                  Rejeter
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
