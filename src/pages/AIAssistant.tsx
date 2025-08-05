
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState as useReactState } from "react";
import AISuggestionDialog from "@/components/AISuggestionDialog";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AISuggestion {
  type: "task" | "goal" | "habit";
  title: string;
  description?: string;
  priority?: string;
  frequency?: string;
  category?: string;
  reasoning: string;
}

const STORAGE_KEY = 'deepflow_ai_conversation';

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Gérer ouverture du menu mobile localement
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useReactState(false);

  const { 
    habitsData, 
    tasksData, 
    focusData, 
    activityData, 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount,
    refetch 
  } = useAnalyticsData();

  // Charger la conversation depuis localStorage au démarrage
  useEffect(() => {
    if (user) {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      const savedConversation = localStorage.getItem(storageKey);
      if (savedConversation) {
        try {
          const parsedMessages = JSON.parse(savedConversation);
          setMessages(parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (error) {
          console.error("Erreur lors du chargement de la conversation:", error);
        }
      }
    }
  }, [user]);

  // Sauvegarder la conversation dans localStorage à chaque changement
  useEffect(() => {
    if (user && messages.length > 0) {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const clearConversation = () => {
    setMessages([]);
    if (user) {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.removeItem(storageKey);
    }
    toast.success("Conversation effacée");
  };

  const getUserData = async () => {
    if (!user) return {};

    try {
      const [
        tasksResult,
        habitsResult,
        goalsResult,
        journalResult,
        focusResult,
        profileResult,
        settingsResult
      ] = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_settings').select('*').eq('id', user.id).single()
      ]);

      return {
        tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
        habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
        goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
        journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
        focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
        profile: profileResult.status === 'fulfilled' ? profileResult.value.data : null,
        settings: settingsResult.status === 'fulfilled' ? settingsResult.value.data : null,
        analytics: {
          taskCompletionRate,
          totalFocusTime,
          streakCount,
          habitsCount: habitsData.length,
          focusSessionsCount: focusData.length,
          activityCount: activityData.reduce((sum, day) => sum + day.count, 0)
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return {};
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const userData = await getUserData();
      const recentMessages = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: input,
          user_id: user.id,
          context: {
            user_data: userData,
            recent_messages: recentMessages
          }
        }
      });

      if (error) throw error;

      let assistantContent = data.response || "Désolé, je n'ai pas pu traiter votre demande.";
      
      // Clean up response - remove any JSON artifacts
      assistantContent = assistantContent
        .replace(/```json[\s\S]*?```/g, "")
        .replace(/\{[\s\S]*?"suggestion"[\s\S]*?\}/g, "")
        .replace(/```[\s\S]*?```/g, "")
        .trim();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle AI suggestion only if one is provided
      if (data.suggestion && data.suggestion.type && data.suggestion.title) {
        setCurrentSuggestion(data.suggestion);
        setIsSuggestionDialogOpen(true);
      }

    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Erreur lors de l'envoi du message");
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

  const handleSuggestionConfirm = () => {
    refetch();
    toast.success("Élément créé avec succès ! 🎉");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="md:hidden">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 w-full h-screen flex flex-col">
        <Card className="flex-1 flex flex-col w-full h-[100dvh] rounded-none md:rounded-xl shadow-none md:shadow-lg bg-background md:my-4 md:w-[90%] md:mx-auto transition-all">
          <CardHeader className="flex-shrink-0 px-4 pt-4 pb-2 sm:px-6 sm:pt-8">
            <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-2xl md:flex">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="font-semibold">Assistant IA <span className="hidden sm:inline">DeepFlow</span></span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearConversation}
                disabled={messages.length === 0}
                className="!rounded-lg"
              >
                Effacer
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden pt-14 md:pt-0">
            <ScrollArea
              className="flex-1 px-1 sm:px-8 pt-2 pb-2 w-full h-[50vh] sm:h-auto max-h-[60vh] sm:max-h-none overflow-y-auto"
              ref={scrollAreaRef}
              style={{
                minHeight: '200px',
                maxHeight: 'calc(100dvh - 160px)',
              }}
            >
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                    <p className="text-lg font-medium mb-2">Bonjour ! Je suis votre assistant IA personnel. 🤖</p>
                    <p className="text-sm">
                      Je peux analyser vos besoins et vous suggérer intelligemment des tâches, habitudes et objectifs ! 🚀
                    </p>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[90vw] sm:max-w-[60%] rounded-lg p-2 sm:p-3 min-w-0 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} text-sm break-words`}>
                      {message.role === 'assistant' ? (
                        <Markdown content={message.content} />
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 sm:gap-3 justify-start">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-2 sm:p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">
                          En train de réfléchir... 🤔
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="border-t bg-background px-1 py-2 sm:px-6 flex-shrink-0 flex gap-2 sticky bottom-0 left-0 w-full z-10">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="flex-1 text-base h-11 px-2 rounded-lg focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-11 w-11 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AISuggestionDialog
        suggestion={currentSuggestion}
        isOpen={isSuggestionDialogOpen}
        onClose={() => {
          setIsSuggestionDialogOpen(false);
          setCurrentSuggestion(null);
        }}
        onConfirm={handleSuggestionConfirm}
      />
    </div>
  );
}
