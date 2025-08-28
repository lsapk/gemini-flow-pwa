
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Send, Bot, User, Loader2, Settings, Sparkles, BarChart3 } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
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
  const [creationModeEnabled, setCreationModeEnabled] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (user && messages.length > 0) {
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, user]);

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
        settingsResult,
        completionsResult
      ] = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_settings').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('habit_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      ]);

      return {
        tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
        habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
        goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
        journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
        focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
        habit_completions: completionsResult.status === 'fulfilled' ? (completionsResult.value.data || []) : [],
        profile: profileResult.status === 'fulfilled' ? profileResult.value.data : null,
        settings: settingsResult.status === 'fulfilled' ? settingsResult.value.data : null,
        analytics: {
          taskCompletionRate,
          totalFocusTime,
          streakCount,
          habitsCount: habitsData?.length || 0,
          focusSessionsCount: focusData?.length || 0,
          activityCount: activityData?.reduce((sum, day) => sum + day.count, 0) || 0
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

      console.log('Sending message to AI:', { input, userData, recentMessages, creationModeEnabled, analysisMode });

      let finalMessage = input;
      let messageContext = "conversation normale";

      if (analysisMode) {
        finalMessage = `[MODE ANALYSE APPROFONDIE ACTIVÉ] ${input} - Analyse mes données en profondeur et fournis des insights détaillés, des tendances et des recommandations personnalisées basées sur mes métriques réelles.`;
        messageContext = "analyse approfondie des données";
      } else if (creationModeEnabled) {
        finalMessage = `[MODE CRÉATION ACTIVÉ] ${input} - Tu peux suggérer des créations de tâches, habitudes ou objectifs si pertinent selon ma demande.`;
        messageContext = "mode création";
      } else {
        finalMessage = `[MODE DISCUSSION] ${input} - Je veux juste discuter et obtenir des conseils, ne suggère PAS de créations sauf si je le demande explicitement.`;
        messageContext = "discussion et conseil";
      }

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: finalMessage,
          user_id: user.id,
          context: {
            user_data: userData,
            recent_messages: recentMessages,
            creation_mode: creationModeEnabled,
            analysis_mode: analysisMode,
            message_context: messageContext
          }
        }
      });

      console.log('AI response received:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      let assistantContent = data?.response || "Désolé, je n'ai pas pu traiter votre demande.";
      
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

      // Handle AI suggestion only if creation mode is enabled and suggestion is valid
      if (creationModeEnabled && 
          data?.suggestion && 
          data.suggestion.type && 
          data.suggestion.title && 
          data.suggestion.reasoning) {
        console.log('Valid AI suggestion received:', data.suggestion);
        setCurrentSuggestion(data.suggestion);
        setIsSuggestionDialogOpen(true);
      }

    } catch (error: any) {
        console.error('Erreur complète:', error);
        let errorContent = "Désolé, une erreur s'est produite. Veuillez réessayer.";
        
        // Check if it's a quota error
        if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
          errorContent = "🚫 **Limite d'API atteinte** - Le quota journalier de l'IA a été dépassé (50 requêtes/jour). Réessayez demain ou contactez l'admin pour augmenter le quota.";
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: errorContent,
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

  const getPlaceholderText = () => {
    if (analysisMode) return "Demandez une analyse approfondie de vos données...";
    if (creationModeEnabled) return "Décrivez ce que vous souhaitez créer...";
    return "Posez vos questions sur la productivité...";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="flex-1 flex flex-col w-full h-[100dvh] rounded-none md:rounded-xl shadow-none md:shadow-lg bg-background md:my-4 md:w-[90%] md:mx-auto transition-all">
          <CardHeader className="flex-shrink-0 px-4 pt-4 pb-2 sm:px-6 sm:pt-8">
            <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-2xl md:flex">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="font-semibold">Assistant IA <span className="hidden sm:inline">DeepFlow</span></span>
                {analysisMode && <BarChart3 className="h-4 w-4 text-blue-500" />}
                {creationModeEnabled && <Sparkles className="h-4 w-4 text-green-500" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <Label htmlFor="analysis-mode" className="text-xs">Analyse</Label>
                  <Switch
                    id="analysis-mode"
                    checked={analysisMode}
                    onCheckedChange={(checked) => {
                      setAnalysisMode(checked);
                      if (checked) setCreationModeEnabled(false);
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <Label htmlFor="creation-mode" className="text-xs">Création</Label>
                  <Switch
                    id="creation-mode"
                    checked={creationModeEnabled}
                    onCheckedChange={(checked) => {
                      setCreationModeEnabled(checked);
                      if (checked) setAnalysisMode(false);
                    }}
                  />
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
              </div>
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
                    <p className="text-sm mb-4">
                      {analysisMode ? "Mode analyse approfondie activé - Je vais analyser vos données en détail ! 📊" :
                       creationModeEnabled ? "Mode création activé - Je peux créer des éléments selon vos besoins ! ✨" :
                       "Je suis là pour discuter de votre productivité et vous conseiller ! 💬"}
                    </p>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg max-w-md mx-auto">
                      <p className="font-medium mb-1">
                        {analysisMode ? "🔍 Mode Analyse Approfondie" :
                         creationModeEnabled ? "✨ Mode Création" : "💬 Mode Discussion"}
                      </p>
                      <p>
                        {analysisMode ? "Je vais analyser vos données, identifier des tendances et vous donner des insights personnalisés" :
                         creationModeEnabled ? "Je peux créer des tâches, habitudes et objectifs selon vos besoins" :
                         "Mode discussion - je me concentre sur l'analyse et les conseils"}
                      </p>
                    </div>
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

                    <div className={`max-w-[90vw] sm:max-w-[70%] rounded-lg p-2 sm:p-3 min-w-0 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} text-sm break-words`}>
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
                          {analysisMode ? "Analyse en cours de vos données... 📊" :
                           creationModeEnabled ? "Création en cours... ✨" : 
                           "Réflexion en cours... 🤔"}
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
                placeholder={getPlaceholderText()}
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
