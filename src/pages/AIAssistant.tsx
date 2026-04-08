import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useSubscription } from "@/hooks/useSubscription";
import { Send, Bot, User, Loader2, Sparkles, BarChart3, Crown, Brain, MessageSquare, Zap, Trash2, Lightbulb, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAICredits } from "@/hooks/useAICredits";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
import AISuggestionDialog from "@/components/AISuggestionDialog";
import Analysis from "./Analysis";
import Profile from "./Profile";
import { cn } from "@/lib/utils";

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

type ChatMode = 'discussion' | 'analysis' | 'creation';

const STORAGE_KEY = 'deepflow_ai_conversation';

const QUICK_ACTIONS = [
  { icon: BarChart3, label: "Analyse ma semaine", emoji: "📊" },
  { icon: Target, label: "Que faire maintenant ?", emoji: "🎯" },
  { icon: Sparkles, label: "Crée un plan", emoji: "✨" },
  { icon: Lightbulb, label: "Conseils personnalisés", emoji: "💡" },
];

export default function AIAssistant() {
  const { user } = useAuth();
  const { credits: aiCredits, isLoading: creditsLoading, isAdmin: isAIAdmin } = useAICredits();
  const { canUseFeature, getRemainingUses, trackUsage, isPremium } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('discussion');
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'analysis') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const {
    habitsData, tasksData, focusData, activityData,
    taskCompletionRate, totalFocusTime, streakCount, refetch
  } = useAnalyticsData();

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((msg: Message) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
        } catch { /* ignore */ }
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  useEffect(() => {
    if (activeTab === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const clearConversation = () => {
    setMessages([]);
    if (user) localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    toast.success("Conversation effacée");
  };

  const getUserData = async () => {
    if (!user) return {};
    try {
      const [tasksR, habitsR, goalsR, journalR, focusR, profileR, completionsR] = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('habit_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      ]);
      return {
        tasks: tasksR.status === 'fulfilled' ? (tasksR.value.data || []) : [],
        habits: habitsR.status === 'fulfilled' ? (habitsR.value.data || []) : [],
        goals: goalsR.status === 'fulfilled' ? (goalsR.value.data || []) : [],
        journal_entries: journalR.status === 'fulfilled' ? (journalR.value.data || []) : [],
        focus_sessions: focusR.status === 'fulfilled' ? (focusR.value.data || []) : [],
        habit_completions: completionsR.status === 'fulfilled' ? (completionsR.value.data || []) : [],
        profile: profileR.status === 'fulfilled' ? profileR.value.data : null,
        analytics: { taskCompletionRate, totalFocusTime, streakCount, habitsCount: habitsData?.length || 0, focusSessionsCount: focusData?.length || 0 }
      };
    } catch { return {}; }
  };

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() || !user) return;
    if (!canUseFeature("chat")) {
      toast.error("Limite quotidienne atteinte. Passez à Premium !");
      return;
    }

    const newMessage: Message = { id: Date.now().toString(), content: text, role: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);
    trackUsage("chat");

    try {
      const userData = await getUserData();
      const recentMessages = messages.slice(-10).map(msg => ({ role: msg.role, content: msg.content }));
      let finalMessage = text;
      if (chatMode === 'analysis') finalMessage = `[MODE ANALYSE] ${text} - Analyse approfondie.`;
      else if (chatMode === 'creation') finalMessage = `[MODE CRÉATION] ${text}`;
      else finalMessage = `[MODE DISCUSSION] ${text}`;

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: { message: finalMessage, context: { user_data: userData, recent_messages: recentMessages, creation_mode: chatMode === 'creation', analysis_mode: chatMode === 'analysis' } }
      });
      if (error) throw error;

      let content = data?.response || "Désolé, je n'ai pas pu traiter votre demande.";
      content = content.replace(/```json[\s\S]*?```/g, "").replace(/\{[\s\S]*?"suggestion"[\s\S]*?\}/g, "").replace(/```[\s\S]*?```/g, "").trim();

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content, role: 'assistant', timestamp: new Date() }]);

      if (chatMode === 'creation' && data?.suggestion?.type && data?.suggestion?.title && data?.suggestion?.reasoning) {
        setCurrentSuggestion(data.suggestion);
        setIsSuggestionDialogOpen(true);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      let errContent = "Désolé, une erreur s'est produite.";
      if (msg.includes('402') || msg.includes('credits')) errContent = "💳 **Crédits IA épuisés**";
      else if (msg.includes('429')) errContent = "🚫 **Limite d'API atteinte**";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: errContent, role: 'assistant', timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleQuickAction = (label: string) => {
    setInput(label);
    sendMessage(label);
  };

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "analysis", label: "Analyse", icon: BarChart3 },
    { id: "profile", label: "Profil IA", icon: Brain },
  ];

  const modes: { id: ChatMode; label: string; icon: React.ElementType }[] = [
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'analysis', label: 'Analyse', icon: BarChart3 },
    { id: 'creation', label: 'Création', icon: Sparkles },
  ];

  return (
    <div className="flex flex-col max-w-7xl mx-auto h-[calc(100vh-120px)] md:h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-primary" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">Intelligence IA</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Coach personnel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-8 px-3 rounded-xl font-medium bg-secondary/60 backdrop-blur-sm border-border/30">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500 fill-amber-500" />
            {isAIAdmin ? "∞" : aiCredits}
          </Badge>
          {isPremium && (
            <Badge className="h-8 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-sm">
              <Crown className="h-3.5 w-3.5 mr-1 fill-white" />Pro
            </Badge>
          )}
        </div>
      </div>

      {/* Segmented Control */}
      <div className="bg-secondary/40 backdrop-blur-xl p-1 rounded-2xl mb-3 shrink-0 border border-border/20">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300",
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Tab */}
      <div className={cn("flex flex-col flex-1 min-h-0 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 shadow-lg overflow-hidden", activeTab !== "chat" && "hidden")}>
          {/* Mode Pills + Clear */}
          <div className="px-3 py-2.5 border-b border-border/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 bg-secondary/40 p-0.5 rounded-full">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setChatMode(mode.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200",
                    chatMode === mode.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <mode.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={clearConversation}
              disabled={messages.length === 0}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-lg">
                    <Bot className="h-9 w-9 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-base font-bold tracking-tight">Comment puis-je vous aider ?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Votre assistant IA analyse vos données pour des conseils personnalisés.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.label)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 text-xs font-medium text-foreground hover:scale-[1.03] hover:shadow-md active:scale-[0.97] transition-all duration-200"
                    >
                      <span>{action.emoji}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                  className={cn("flex gap-2.5", message.role === 'user' ? "justify-end" : "justify-start")}
                >
                  {message.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className="group flex flex-col max-w-[80%] md:max-w-[70%]">
                    <div className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card/80 backdrop-blur-sm border border-border/30 rounded-bl-md"
                    )}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1">
                          <Markdown content={message.content} />
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/40 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-7 w-7 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions above input when conversation has messages */}
          {messages.length > 0 && messages.length < 3 && (
            <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto shrink-0">
              {QUICK_ACTIONS.slice(0, 3).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label)}
                  className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/40 border border-border/20 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all shrink-0"
                >
                  <span>{action.emoji}</span>{action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 shrink-0 border-t border-border/20">
            <div className="relative flex items-center bg-secondary/40 backdrop-blur-sm rounded-2xl border border-border/20 pr-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={chatMode === 'analysis' ? "Demandez une analyse..." : chatMode === 'creation' ? "Décrivez ce que vous souhaitez créer..." : "Message..."}
                disabled={isLoading}
                className="flex-1 bg-transparent h-11 px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                autoFocus
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                  input.trim()
                    ? "bg-primary text-primary-foreground shadow-sm active:scale-[0.92]"
                    : "text-muted-foreground/40"
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[10px] text-muted-foreground/40">L'IA peut faire des erreurs</p>
              {!isPremium && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-transparent text-muted-foreground/40 border-none">
                  {getRemainingUses("chat")}/5
                </Badge>
              )}
            </div>
          </div>
      </div>

      {/* Analysis Tab — lazy mount to avoid recharts width=0 warnings */}
      {activeTab === "analysis" && (
        <div className="flex-1 overflow-y-auto animate-fade-in">
          <Analysis />
        </div>
      )}

      {/* Profile Tab — lazy mount */}
      {activeTab === "profile" && (
        <div className="flex-1 overflow-y-auto animate-fade-in">
          <Profile />
        </div>
      )}

      <AISuggestionDialog
        suggestion={currentSuggestion}
        isOpen={isSuggestionDialogOpen}
        onClose={() => { setIsSuggestionDialogOpen(false); setCurrentSuggestion(null); }}
        onConfirm={() => { refetch(); toast.success("Élément créé ! 🎉"); }}
      />
    </div>
  );
}
