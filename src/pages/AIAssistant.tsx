
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useSubscription } from "@/hooks/useSubscription";
import { Send, Bot, User, Loader2, Sparkles, BarChart3, Crown, Brain, MessageSquare, Zap, Trash2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAICredits } from "@/hooks/useAICredits";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
import AISuggestionDialog from "@/components/AISuggestionDialog";
import { Link } from "react-router-dom";
import Analysis from "./Analysis";
import Profile from "./Profile";

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
  const { credits: aiCredits, isLoading: creditsLoading, isAdmin: isAIAdmin } = useAICredits();
  const { canUseFeature, getRemainingUses, trackUsage, isPremium, currentTier } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [creationModeEnabled, setCreationModeEnabled] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
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
    // Check if user can use chat feature
    if (!canUseFeature("chat")) {
      toast.error("Limite quotidienne atteinte. Passez à Premium pour un accès illimité !");
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    // Track usage for Basic users
    trackUsage("chat");

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
        
        // Check if it's a credits exhausted error (402)
        if (error?.message?.includes('402') || error?.message?.includes('credits exhausted') || error?.message?.includes('Payment Required')) {
          errorContent = "💳 **Crédits IA épuisés** - Vos crédits Lovable AI sont épuisés. Ajoutez des crédits dans Settings → Cloud → Usage pour continuer à utiliser l'IA.";
        }
        // Check if it's a rate limit error (429)
        else if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
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
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-60px)] flex flex-col max-w-7xl mx-auto overflow-hidden">
      {/* Header compact */}
      <div className="flex flex-col mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">Intelligence IA</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Votre coach personnel propulsé par l'IA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isAIAdmin ? "default" : aiCredits <= 10 ? "destructive" : "secondary"} className="h-7 px-3 rounded-full font-medium">
              <Zap className="h-3.5 w-3.5 mr-1 text-amber-500 fill-amber-500" />
              {isAIAdmin ? "Illimité" : `${aiCredits} crédits`}
            </Badge>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none h-7 px-3 rounded-full shadow-sm">
                <Crown className="h-3.5 w-3.5 mr-1 fill-white" />
                Premium
              </Badge>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Analyse</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Profil IA</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-0 h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm rounded-2xl border shadow-xl overflow-hidden">
              {/* Toolbar du chat */}
              <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 group">
                    <div className={analysisMode ? "text-primary" : "text-muted-foreground"}>
                      <BarChart3 className="h-4 w-4 transition-colors" />
                    </div>
                    <Label htmlFor="analysis-mode" className="text-xs font-semibold cursor-pointer">Analyse</Label>
                    <Switch
                      id="analysis-mode"
                      checked={analysisMode}
                      onCheckedChange={(checked) => {
                        setAnalysisMode(checked);
                        if (checked) setCreationModeEnabled(false);
                      }}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center gap-2 group">
                    <div className={creationModeEnabled ? "text-primary" : "text-muted-foreground"}>
                      <Sparkles className="h-4 w-4 transition-colors" />
                    </div>
                    <Label htmlFor="creation-mode" className="text-xs font-semibold cursor-pointer">Création</Label>
                    <Switch
                      id="creation-mode"
                      checked={creationModeEnabled}
                      onCheckedChange={(checked) => {
                        setCreationModeEnabled(checked);
                        if (checked) setAnalysisMode(false);
                      }}
                      className="scale-75"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearConversation}
                    disabled={messages.length === 0}
                    className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Effacer
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Zone des messages */}
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="p-4 md:p-6 space-y-6">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
                        <div className="p-6 bg-primary/5 rounded-full ring-1 ring-primary/10 animate-pulse">
                          <Bot className="h-12 w-12 text-primary/60" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold tracking-tight">Prêt à booster votre productivité ?</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {analysisMode ? "Envoyez un message pour lancer une analyse approfondie de vos performances récentes." :
                             creationModeEnabled ? "Je suis prêt à vous aider à structurer vos journées en créant des tâches et des habitudes." :
                             "Posez-moi n'importe quelle question sur votre organisation ou demandez des conseils personnalisés."}
                          </p>
                        </div>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className={`w-8 h-8 rounded-lg shadow-sm border ${message.role === 'user' ? 'bg-primary' : 'bg-background'}`}>
                            {message.role === 'assistant' ? (
                              <Bot className="h-4 w-4 text-primary" />
                            ) : (
                              <User className="h-4 w-4 text-primary-foreground" />
                            )}
                          </Avatar>

                          <div className={`flex flex-col space-y-1.5 max-w-[85%] md:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 rounded-2xl shadow-sm border ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-background rounded-tl-none'
                            }`}>
                              {message.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50">
                                  <Markdown content={message.content} />
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1 font-medium uppercase tracking-wider">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3"
                      >
                        <Avatar className="w-8 h-8 rounded-lg shadow-sm bg-background border">
                          <Bot className="h-4 w-4 text-primary" />
                        </Avatar>
                        <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-none px-4 py-3 border">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                              {analysisMode ? "Analyse en cours..." : "Réflexion en cours..."}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t bg-background/50 backdrop-blur-md">
                <div className="relative flex items-center max-w-4xl mx-auto gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={getPlaceholderText()}
                      disabled={isLoading}
                      className="pr-12 h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-primary shadow-inner bg-background/80"
                      autoFocus
                    />
                    {!isPremium && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/50 border-none">
                          {getRemainingUses("chat")}/5
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20 shrink-0 transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-center mt-2 text-muted-foreground italic">
                  L'IA peut faire des erreurs. Vérifiez les informations importantes.
                </p>
              </div>
            </div>
          </TabsContent>
            
            <TabsContent value="analysis" className="mt-0">
              <Analysis />
            </TabsContent>
            
            <TabsContent value="profile" className="mt-0">
              <Profile />
            </TabsContent>
          </Tabs>
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
