
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Sparkles, ArrowLeft, Menu, X } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/layout/Sidebar";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: { 
          message: userMessage.content, 
          chatHistory: messages,
          userId: user.id 
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Assistant IA</h3>
            <p className="text-muted-foreground">
              Veuillez vous connecter pour accéder à l'assistant IA.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur md:hidden">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Assistant IA</h1>
          </div>
          
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar className="border-0" />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="hidden md:block p-6 border-b">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-8 w-8" />
                Assistant IA
              </h1>
              <p className="text-muted-foreground">
                Votre coach personnel pour la productivité et le bien-être
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-3 md:p-6">
            <Card className="flex-1 flex flex-col h-full">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  DeepFlow Assistant
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col gap-4 p-3 md:p-4 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="flex-1 pr-2 md:pr-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Bonjour ! 👋</h3>
                        <p className="text-muted-foreground mb-4 text-sm md:text-base">
                          Je suis DeepFlow, votre assistant IA personnel. Je peux vous aider avec :
                        </p>
                        <div className="text-left max-w-md mx-auto space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span>📝</span>
                            <span>Créer et gérer vos tâches</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🎯</span>
                            <span>Suivre vos habitudes et objectifs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📖</span>
                            <span>Rédiger des entrées de journal</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>💡</span>
                            <span>Conseils personnalisés de productivité</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mt-4 text-sm">
                          Posez-moi une question ou demandez-moi de créer quelque chose !
                        </p>
                      </div>
                    )}
                    
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 md:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Bot className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2 md:p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground ml-6 md:ml-8"
                              : "bg-muted"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <Markdown content={message.content} />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                          )}
                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {message.role === "user" && (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <User className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-2 md:gap-3 justify-start">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-muted rounded-lg p-2 md:p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message... (Entrée pour envoyer)"
                    className="flex-1 min-h-[50px] md:min-h-[60px] max-h-32 resize-none text-sm md:text-base"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    size="lg"
                    className="px-3 md:px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
