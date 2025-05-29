
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/Markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Message de bienvenue
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      content: "👋 **Salut ! Je suis ton assistant IA personnel DeepFlow** 🚀\n\nJe connais toutes tes données : tâches, habitudes, objectifs, sessions de focus et journal. Pose-moi n'importe quelle question sur ta productivité ! 💪\n\n✨ *Exemples : \"Comment améliorer ma productivité ?\", \"Analyse mes habitudes\", \"Résume ma semaine\"*",
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      content: "",
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-analysis', {
        body: {
          prompt: input.trim(),
          userId: user.id
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.content || "❌ Désolé, je n'ai pas pu générer de réponse.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat([aiMessage]));

    } catch (error) {
      console.error("Erreur lors de l'appel à l'IA:", error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "⚠️ **Oups ! Une erreur est survenue**\n\nImpossible de traiter ta demande pour le moment. Réessaie dans quelques instants ! 🔄",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat([errorMessage]));
      
      toast({
        title: "Erreur",
        description: "Impossible de contacter l'assistant IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Assistant IA DeepFlow</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground hidden md:block">
            Votre analyste personnel de productivité
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
                
                <Card className={`max-w-[80%] ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <CardContent className="p-3">
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">L'assistant réfléchit...</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {message.isUser ? (
                          <p className="m-0">{message.content}</p>
                        ) : (
                          <Markdown content={message.content} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {message.isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pose-moi une question sur ta productivité..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💡 L'assistant a accès à toutes tes données pour des analyses personnalisées
          </p>
        </div>
      </div>
    </div>
  );
}
