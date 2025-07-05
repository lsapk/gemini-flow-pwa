
import { useState, useEffect } from 'react';
import { aiActionsService, PendingAIAction } from '@/services/aiActionsService';

export const useAIActions = () => {
  const [pendingActions, setPendingActions] = useState<PendingAIAction[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Écouter les changements d'actions en attente
    const checkPendingActions = () => {
      const actions = aiActionsService.getPendingActions();
      setPendingActions(actions);
      setShowConfirmation(actions.length > 0);
    };

    // Vérifier immédiatement
    checkPendingActions();

    // Vérifier périodiquement (pour les actions créées par l'assistant)
    const interval = setInterval(checkPendingActions, 1000);

    return () => clearInterval(interval);
  }, []);

  const proposeActions = (actions: Omit<PendingAIAction, 'id'>[]) => {
    const actionsWithIds = aiActionsService.proposeActions(
      actions as PendingAIAction[],
      () => {
        // Callback après confirmation
        setPendingActions([]);
        setShowConfirmation(false);
      }
    );
    setPendingActions(actionsWithIds);
    setShowConfirmation(true);
    return actionsWithIds;
  };

  const confirmActions = async () => {
    setShowConfirmation(false);
    setPendingActions([]);
  };

  const cancelActions = async () => {
    await aiActionsService.cancelActions();
    setShowConfirmation(false);
    setPendingActions([]);
  };

  return {
    pendingActions,
    showConfirmation,
    proposeActions,
    confirmActions,
    cancelActions,
    hasPendingActions: aiActionsService.hasPendingActions()
  };
};
