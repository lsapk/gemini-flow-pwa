
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/Markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import MobileHeader from "@/components/layout/MobileHeader";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Charger les messages depuis localStorage
    const savedMessages = localStorage.getItem('ai-assistant-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.error('Error loading saved messages:', e);
      }
    }
    
    return [
      {
        id: '1',
        role: 'assistant',
        content: 'Bonjour ! Je suis votre assistant IA personnel pour DeepFlow. J\'ai maintenant accès à toutes vos données et je peux vous aider avec vos objectifs de productivité, analyser vos habitudes, **créer des tâches, habitudes et objectifs**, et vous donner des conseils personnalisés basés sur vos vraies données. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date()
      }
    ];
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Sauvegarder les messages dans localStorage
  useEffect(() => {
    localStorage.setItem('ai-assistant-messages', JSON.stringify(messages));
  }, [messages]);

  const fetchAllUserData = useCallback(async () => {
    if (!user) return;

    console.log("Fetching user data for AI Assistant...");
    setIsRefreshing(true);

    try {
      const [
        tasksResult,
        habitsResult,
        goalsResult,
        journalResult,
        focusResult,
        profileResult,
        settingsResult,
        reflectionsResult
      ] = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_settings').select('*').eq('id', user.id).single(),
        supabase.from('daily_reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      ]);

      const newUserData = {
        tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
        habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
        goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
        journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
        focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
        daily_reflections: reflectionsResult.status === 'fulfilled' ? (reflectionsResult.value.data || []) : [],
        user_profile: profileResult.status === 'fulfilled' ? profileResult.value.data : null,
        user_settings: settingsResult.status === 'fulfilled' ? settingsResult.value.data : null,
        user_id: user.id,
        user_email: user.email,
        timestamp: new Date().toISOString(),
        summary: {
          total_tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []).length : 0,
          completed_tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []).filter((t: any) => t.completed).length : 0,
          total_habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []).length : 0,
          total_goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []).length : 0,
          completed_goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []).filter((g: any) => g.completed).length : 0,
          total_focus_time: focusResult.status === 'fulfilled' ? (focusResult.value.data || []).reduce((sum: number, session: any) => sum + (session.duration || 0), 0) : 0,
          total_journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []).length : 0
        }
      };

      setUserData(newUserData);
      console.log("User data fetched successfully:", newUserData.summary);

    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllUserData();
    }
  }, [user, fetchAllUserData]);

  const clearConversation = () => {
    const initialMessage = {
      id: '1',
      role: 'assistant' as const,
      content: 'Bonjour ! Je suis votre assistant IA personnel pour DeepFlow. J\'ai maintenant accès à toutes vos données et je peux vous aider avec vos objectifs de productivité, analyser vos habitudes, **créer des tâches, habitudes et objectifs**, et vous donner des conseils personnalisés basés sur vos vraies données. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    };
    setMessages([initialMessage]);
    toast.success('Conversation effacée');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Rafraîchir les données avant l'envoi
      await fetchAllUserData();

      console.log("Sending message to AI with context:", {
        message: currentInput,
        user_id: user.id,
        userDataSummary: userData.summary
      });

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: currentInput,
          user_id: user.id,
          context: {
            user_data: userData,
            recent_messages: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp
            }))
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log("AI response received:", data);

      let responseContent = data.response || 'Désolé, je n\'ai pas pu traiter votre demande.';
      
      // Gérer les erreurs de l'IA
      if (data.error) {
        responseContent = data.response || 'Une erreur s\'est produite. Veuillez réessayer.';
        toast.error('Erreur de l\'assistant IA');
      }

      // Si une action a été exécutée avec succès
      if (data.action_result) {
        toast.success('Élément créé avec succès !');
        // Rafraîchir les données après création
        setTimeout(() => {
          fetchAllUserData();
        }, 1000);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de la communication avec l\'assistant IA');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sidebarContent = <Sidebar onItemClick={() => setSidebarOpen(false)} />;

  const renderContent = () => (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Assistant IA</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllUserData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Conversation avec votre assistant IA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Accès complet à vos données : {userData.summary?.total_tasks || 0} tâches, {userData.summary?.total_habits || 0} habitudes, {userData.summary?.total_goals || 0} objectifs, {userData.summary?.total_journal_entries || 0} entrées journal
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">L'assistant analyse vos données...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Demandez-moi de créer une tâche, analyser vos habitudes, ou autre... (Entrée pour envoyer)"
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <DrawerContent>
            {sidebarContent}
          </DrawerContent>
        </Drawer>
        <div className="pt-14 px-3 sm:px-6 pb-6">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {sidebarContent}
      <div className="flex-1 px-3 sm:px-6 py-6">
        {renderContent()}
      </div>
    </div>
  );
}
