
import { useState, useEffect } from 'react';
import { aiActionsService, PendingAIAction } from '@/services/aiActionsService';

export const useAIActions = () => {
  const [pendingActions, setPendingActions] = useState<PendingAIAction[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const checkPendingActions = () => {
      const actions = aiActionsService.getPendingActions();
      if (actions.length > 0) {
        setPendingActions(actions);
        setShowConfirmation(true);
      }
    };

    checkPendingActions();
    const interval = setInterval(checkPendingActions, 1000);

    return () => clearInterval(interval);
  }, []);

  const proposeActions = async (actions: Omit<PendingAIAction, 'id'>[]) => {
    const actionsWithIds = actions.map(action => ({
      ...action,
      id: action.id || crypto.randomUUID()
    })) as PendingAIAction[];
    
    const proposedActions = aiActionsService.proposeActions(
      actionsWithIds,
      () => {
        setPendingActions([]);
        setShowConfirmation(false);
      }
    );
    
    setPendingActions(proposedActions);
    setShowConfirmation(true);
    return proposedActions;
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
    hasPendingActions: pendingActions.length > 0
  };
};
