
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { AIActionButton } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionButtons?: AIActionButton[];
}

interface AIContext {
  habits: any[];
  tasks: any[];
  goals: any[];
  journalEntries: any[];
  focusSessions: any[];
  userProfile: any;
}

export const useAIAssistantEnhanced = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<AIContext | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesRef = useRef<ChatMessage[]>([]);

  // Garder seulement les 10 derniers messages
  useEffect(() => {
    if (messages.length > 10) {
      setMessages(prev => prev.slice(-10));
    }
    messagesRef.current = messages;
  }, [messages]);

  // Charger le contexte en temps réel
  const loadContext = useCallback(async () => {
    if (!user) return;

    try {
      const [habits, tasks, goals, journalEntries, focusSessions, userProfile] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('goals').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_profiles').select('*').eq('id', user.id).single()
      ]);

      setContext({
        habits: habits.data || [],
        tasks: tasks.data || [],
        goals: goals.data || [],
        journalEntries: journalEntries.data || [],
        focusSessions: focusSessions.data || [],
        userProfile: userProfile.data || {}
      });
    } catch (error) {
      console.error('Erreur lors du chargement du contexte:', error);
    }
  }, [user]);

  useEffect(() => {
    loadContext();
    
    // Recharger le contexte toutes les 30 secondes
    const interval = setInterval(loadContext, 30000);
    return () => clearInterval(interval);
  }, [loadContext]);

  const createMultipleItems = useCallback(async (items: any[], type: 'habits' | 'tasks' | 'goals') => {
    if (!user) return;

    try {
      const tableName = type === 'habits' ? 'habits' : type === 'tasks' ? 'tasks' : 'goals';
      const itemsWithUser = items.map(item => ({
        ...item,
        user_id: user.id,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from(tableName)
        .insert(itemsWithUser);

      if (error) throw error;

      toast({
        title: "Éléments créés",
        description: `${items.length} ${type} créé(s) avec succès.`,
      });

      // Recharger le contexte
      loadContext();
    } catch (error) {
      console.error('Erreur lors de la création multiple:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les éléments.",
        variant: "destructive",
      });
    }
  }, [user, toast, loadContext]);

  const sendMessage = useCallback(async (message: string) => {
    if (!user || !context) return;

    setIsLoading(true);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message,
          context: {
            ...context,
            previousMessages: messagesRef.current.slice(-5).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        }
      });

      if (error) throw error;

      // Analyser la réponse pour détecter les actions proposées
      const actionButtons: AIActionButton[] = [];
      
      if (data.suggestions?.createMultiple) {
        const { type, items } = data.suggestions.createMultiple;
        actionButtons.push({
          id: `create-${type}-${Date.now()}`,
          label: `Créer ${items.length} ${type}`,
          type: 'create-multiple',
          action: () => createMultipleItems(items, type),
          data: { type, items }
        });
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || "Je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
        actionButtons: actionButtons.length > 0 ? actionButtons : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [user, context, createMultipleItems, messagesRef]);

  return {
    messages,
    isLoading,
    context,
    sendMessage,
    loadContext
  };
};
