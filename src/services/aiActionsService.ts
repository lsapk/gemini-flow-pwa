
import { supabase } from "@/integrations/supabase/client";

export interface PendingAIAction {
  id: string;
  type: 'task' | 'habit' | 'goal';
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  due_date?: string;
  category?: string;
  frequency?: string;
  target?: number;
  target_date?: string;
}

export class AIActionsService {
  private static instance: AIActionsService;
  private pendingActions: PendingAIAction[] = [];
  private confirmationCallback?: (actions: PendingAIAction[]) => void;

  static getInstance(): AIActionsService {
    if (!AIActionsService.instance) {
      AIActionsService.instance = new AIActionsService();
    }
    return AIActionsService.instance;
  }

  // Méthode pour proposer des actions à créer
  proposeActions(actions: PendingAIAction[], onConfirm: (actions: PendingAIAction[]) => void) {
    this.pendingActions = actions.map(action => ({
      ...action,
      id: crypto.randomUUID()
    }));
    this.confirmationCallback = onConfirm;
    
    // Sauvegarder les actions en attente dans la base de données
    this.savePendingActions();
    
    return this.pendingActions;
  }

  // Sauvegarder les actions en attente
  private async savePendingActions() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    try {
      await supabase
        .from('ai_pending_actions')
        .insert(
          this.pendingActions.map(action => ({
            user_id: user.id,
            action_type: action.type,
            action_data: action,
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          }))
        );
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  // Confirmer et exécuter les actions
  async confirmActions(actionIds: string[]) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const actionsToExecute = this.pendingActions.filter(action => 
      actionIds.includes(action.id)
    );

    try {
      // Créer les tâches
      const tasks = actionsToExecute.filter(action => action.type === 'task');
      if (tasks.length > 0) {
        await supabase
          .from('tasks')
          .insert(
            tasks.map(task => ({
              title: task.title,
              description: task.description,
              priority: task.priority || 'medium',
              due_date: task.due_date,
              user_id: user.id
            }))
          );
      }

      // Créer les habitudes
      const habits = actionsToExecute.filter(action => action.type === 'habit');
      if (habits.length > 0) {
        await supabase
          .from('habits')
          .insert(
            habits.map(habit => ({
              title: habit.title,
              description: habit.description,
              frequency: habit.frequency || 'daily',
              category: habit.category,
              target: habit.target || 1,
              user_id: user.id
            }))
          );
      }

      // Créer les objectifs
      const goals = actionsToExecute.filter(action => action.type === 'goal');
      if (goals.length > 0) {
        await supabase
          .from('goals')
          .insert(
            goals.map(goal => ({
              title: goal.title,
              description: goal.description,
              category: goal.category || 'personal',
              target_date: goal.target_date,
              user_id: user.id
            }))
          );
      }

      // Supprimer les actions en attente
      await supabase
        .from('ai_pending_actions')
        .delete()
        .eq('user_id', user.id)
        .in('action_data->id', actionIds);

      // Nettoyer les actions locales
      this.pendingActions = this.pendingActions.filter(action => 
        !actionIds.includes(action.id)
      );

      if (this.confirmationCallback) {
        this.confirmationCallback(actionsToExecute);
      }

      return true;
    } catch (error) {
      console.error('Error executing actions:', error);
      throw error;
    }
  }

  // Annuler les actions en attente
  async cancelActions() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    try {
      await supabase
        .from('ai_pending_actions')
        .delete()
        .eq('user_id', user.id);
      
      this.pendingActions = [];
      this.confirmationCallback = undefined;
    } catch (error) {
      console.error('Error canceling actions:', error);
    }
  }

  // Récupérer les actions en attente
  getPendingActions(): PendingAIAction[] {
    return this.pendingActions;
  }

  // Vérifier s'il y a des actions en attente
  hasPendingActions(): boolean {
    return this.pendingActions.length > 0;
  }
}

export const aiActionsService = AIActionsService.getInstance();
