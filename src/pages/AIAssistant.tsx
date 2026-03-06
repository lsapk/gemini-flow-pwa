
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to top when switching to analysis tab
  useEffect(() => {
    if (activeTab === 'analysis') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

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
          setMessages(parsedMessages.map((msg: Message) => ({
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

  // Scroll to bottom of messages
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

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
    trackUsage("chat");

    try {
      const userData = await getUserData();
      const recentMessages = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      let finalMessage = input;

      if (analysisMode) {
        finalMessage = `[MODE ANALYSE APPROFONDIE ACTIVÉ] ${input} - Analyse mes données en profondeur et fournis des insights détaillés.`;
      } else if (creationModeEnabled) {
        finalMessage = `[MODE CRÉATION ACTIVÉ] ${input} - Tu peux suggérer des créations si pertinent.`;
      } else {
        finalMessage = `[MODE DISCUSSION] ${input} - Ne suggère PAS de créations sauf demande explicite.`;
      }

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: finalMessage,
          context: {
            user_data: userData,
            recent_messages: recentMessages,
            creation_mode: creationModeEnabled,
            analysis_mode: analysisMode,
          }
        }
      });

      if (error) throw error;

      let assistantContent = data?.response || "Désolé, je n'ai pas pu traiter votre demande.";
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

      if (creationModeEnabled && data?.suggestion?.type && data?.suggestion?.title && data?.suggestion?.reasoning) {
        setCurrentSuggestion(data.suggestion);
        setIsSuggestionDialogOpen(true);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      let errorContent = "Désolé, une erreur s'est produite. Veuillez réessayer.";
      if (errorMsg.includes('402') || errorMsg.includes('credits exhausted')) {
        errorContent = "💳 **Crédits IA épuisés** — Ajoutez des crédits dans les paramètres.";
      } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        errorContent = "🚫 **Limite d'API atteinte** — Réessayez plus tard.";
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date()
      }]);
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
    if (analysisMode) return "Demandez une analyse approfondie...";
    if (creationModeEnabled) return "Décrivez ce que vous souhaitez créer...";
    return "Posez vos questions sur la productivité...";
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full">
        {/* Header */}
        <div className="flex flex-col mb-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/20">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight leading-tight">Intelligence IA</h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Votre coach personnel propulsé par l'IA</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
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

          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-10">
            <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2 py-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2 py-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Analyse</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2 py-1">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Profil IA</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CHAT TAB — full height */}
        <TabsContent value="chat" className="flex-1 mt-0 animate-in fade-in slide-in-from-bottom-2 focus-visible:outline-none data-[state=inactive]:hidden">
          <div className="flex flex-col bg-card/30 backdrop-blur-sm rounded-2xl border shadow-xl min-h-[calc(100vh-220px)] md:min-h-[calc(100vh-200px)]">
            {/* Toolbar */}
            <div className="px-3 md:px-4 py-2 border-b bg-muted/10 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 bg-background/50 p-1.5 pr-2 rounded-lg border shadow-sm">
                  <BarChart3 className={`h-3.5 w-3.5 transition-colors ${analysisMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label htmlFor="analysis-mode" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">Analyse</Label>
                  <Switch
                    id="analysis-mode"
                    checked={analysisMode}
                    onCheckedChange={(checked) => {
                      setAnalysisMode(checked);
                      if (checked) setCreationModeEnabled(false);
                    }}
                    className="scale-[0.6] origin-left"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-background/50 p-1.5 pr-2 rounded-lg border shadow-sm">
                  <Sparkles className={`h-3.5 w-3.5 transition-colors ${creationModeEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label htmlFor="creation-mode" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">Création</Label>
                  <Switch
                    id="creation-mode"
                    checked={creationModeEnabled}
                    onCheckedChange={(checked) => {
                      setCreationModeEnabled(checked);
                      if (checked) setAnalysisMode(false);
                    }}
                    className="scale-[0.6] origin-left"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                disabled={messages.length === 0}
                className="h-7 text-[10px] uppercase font-bold tracking-wider hover:bg-destructive/10 hover:text-destructive rounded-md px-2"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            </div>

            {/* Messages area — grows to fill available space */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center space-y-4 max-w-md mx-auto">
                  <div className="p-6 bg-primary/5 rounded-full ring-1 ring-primary/10 animate-pulse">
                    <Bot className="h-12 w-12 text-primary/60" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Prêt à booster votre productivité ?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysisMode ? "Envoyez un message pour lancer une analyse approfondie." :
                       creationModeEnabled ? "Je suis prêt à vous aider à structurer vos journées." :
                       "Posez-moi n'importe quelle question sur votre organisation."}
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className={`w-8 h-8 rounded-lg shadow-sm border shrink-0 flex items-center justify-center ${message.role === 'user' ? 'bg-primary' : 'bg-background'}`}>
                      {message.role === 'assistant' ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-primary-foreground" />
                      )}
                    </Avatar>

                    <div className={`flex flex-col space-y-1 max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2.5 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted/50 backdrop-blur-sm border rounded-tl-sm'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                            <Markdown content={message.content} />
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}
                      </div>
                      <span className="text-[10px] opacity-50 px-1 font-medium">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 rounded-lg shadow-sm bg-background border flex items-center justify-center shrink-0">
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input — sticky bottom */}
            <div className="p-3 md:p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
              <div className="relative flex items-center max-w-4xl mx-auto gap-2">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={getPlaceholderText()}
                    disabled={isLoading}
                    className="pr-12 h-11 rounded-xl border-muted-foreground/20 focus-visible:ring-primary shadow-md bg-background/80 text-base"
                    autoFocus
                  />
                  {!isPremium && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 opacity-70">
                        {getRemainingUses("chat")}/5
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20 shrink-0 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-center mt-2 text-muted-foreground/60 font-medium">
                DeepFlow AI peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </div>
        </TabsContent>
            
        {/* ANALYSIS TAB */}
        <TabsContent value="analysis" className="flex-1 mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          <Analysis />
        </TabsContent>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="flex-1 mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          <Profile />
        </TabsContent>
      </Tabs>

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
