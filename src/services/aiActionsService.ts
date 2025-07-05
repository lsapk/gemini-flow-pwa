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

  // Méthode améliorée pour proposer plusieurs actions
  proposeActions(actions: PendingAIAction[], onConfirm: (actions: PendingAIAction[]) => void) {
    // Accepter plusieurs actions et leur donner des IDs uniques
    this.pendingActions = actions.map(action => ({
      ...action,
      id: action.id || crypto.randomUUID()
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
      const actionsToInsert = this.pendingActions.map(action => ({
        user_id: user.id,
        action_type: action.type,
        action_data: JSON.parse(JSON.stringify(action)), // Convert to plain object
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }));

      await supabase
        .from('ai_pending_actions')
        .insert(actionsToInsert);
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  // Confirmer et exécuter les actions sélectionnées
  async confirmActions(actionIds: string[]) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const actionsToExecute = this.pendingActions.filter(action => 
      actionIds.includes(action.id)
    );

    try {
      // Séparer par type
      const tasks = actionsToExecute.filter(a => a.type === 'task');
      const habits = actionsToExecute.filter(a => a.type === 'habit');
      const goals = actionsToExecute.filter(a => a.type === 'goal');

      // Créer les tâches en lot
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map(task => ({
          title: task.title,
          description: task.description || null,
          priority: task.priority || 'medium',
          due_date: task.due_date || null,
          user_id: user.id
        }));
        
        await supabase.from('tasks').insert(tasksToInsert);
      }

      // Créer les habitudes en lot
      if (habits.length > 0) {
        const habitsToInsert = habits.map(habit => ({
          title: habit.title,
          description: habit.description || null,
          frequency: habit.frequency || 'daily',
          category: habit.category || null,
          target: habit.target || 1,
          user_id: user.id
        }));
        
        await supabase.from('habits').insert(habitsToInsert);
      }

      // Créer les objectifs en lot
      if (goals.length > 0) {
        const goalsToInsert = goals.map(goal => ({
          title: goal.title,
          description: goal.description || null,
          category: goal.category || 'personal',
          target_date: goal.target_date || null,
          user_id: user.id
        }));
        
        await supabase.from('goals').insert(goalsToInsert);
      }

      // Supprimer les actions en attente
      await supabase
        .from('ai_pending_actions')
        .delete()
        .eq('user_id', user.id);

      // Nettoyer les actions locales
      this.pendingActions = [];

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
