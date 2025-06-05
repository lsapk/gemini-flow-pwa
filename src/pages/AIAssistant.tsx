
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  Send, 
  User, 
  Loader2,
  Brain,
  Database,
  Zap
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserData {
  habits: any[];
  goals: any[];
  tasks: any[];
  journal_entries: any[];
  good_actions: any[];
  user_settings: any;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
      
      // Charger l'historique des messages depuis localStorage
      const savedMessages = localStorage.getItem(`ai_messages_${user.id}`);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    }
  }, [user]);

  useEffect(() => {
    // Sauvegarder les messages dans localStorage
    if (user && messages.length > 0) {
      // Garder seulement les 10 derniers messages (5 conversations)
      const recentMessages = messages.slice(-10);
      localStorage.setItem(`ai_messages_${user.id}`, JSON.stringify(recentMessages));
    }
  }, [messages, user]);

  useEffect(() => {
    // Auto-scroll vers le bas
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const [habitsRes, goalsRes, tasksRes, journalRes, actionsRes, settingsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('good_actions').select('*').eq('user_id', user.id).limit(5),
        supabase.from('user_settings').select('*').eq('id', user.id).single()
      ]);

      setUserData({
        habits: habitsRes.data || [],
        goals: goalsRes.data || [],
        tasks: tasksRes.data || [],
        journal_entries: journalRes.data || [],
        good_actions: actionsRes.data || [],
        user_settings: settingsRes.data
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Recharger les données utilisateur en temps réel
      await loadUserData();

      // Créer le contexte avec les données utilisateur
      const context = {
        user_data: userData,
        recent_messages: messages.slice(-8) // 4 dernières conversations
      };

      const response = await fetch('/api/gemini-chat-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          context: context,
          user_id: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur réseau');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    if (user) {
      localStorage.removeItem(`ai_messages_${user.id}`);
    }
    toast({
      title: "Historique effacé",
      description: "L'historique des conversations a été supprimé.",
    });
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h1 className="text-2xl sm:text-3xl font-bold">Assistant IA</h1>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Amélioré
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Données temps réel
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Mémoire: {messages.length}/10
          </Badge>
          <Button variant="outline" size="sm" onClick={clearHistory}>
            Effacer l'historique
          </Button>
        </div>
      </div>

      {/* Zone de statistiques des données */}
      {userData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Données disponibles pour l'IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{userData.habits.length}</p>
                <p className="text-xs text-muted-foreground">Habitudes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{userData.goals.length}</p>
                <p className="text-xs text-muted-foreground">Objectifs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">{userData.tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tâches</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{userData.journal_entries.length}</p>
                <p className="text-xs text-muted-foreground">Journaux</p>
              </div>
              <div>
                <p className="text-lg font-bold text-pink-600">{userData.good_actions.length}</p>
                <p className="text-xs text-muted-foreground">Bonnes actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone de chat */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assistant personnel</CardTitle>
          <p className="text-sm text-muted-foreground">
            Votre assistant IA avec accès à toutes vos données en temps réel et une mémoire des conversations récentes.
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Commencez une conversation avec votre assistant IA !</p>
                  <p className="text-sm mt-2">
                    Il a accès à toutes vos données et se souvient de vos conversations récentes.
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">L'assistant réfléchit...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Demandez-moi des conseils sur vos habitudes, objectifs, ou tout autre sujet..."
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? (
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
}
