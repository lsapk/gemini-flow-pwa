import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bot, User, Loader2, AlertCircle, Wifi, WifiOff, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sendChatMessage } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import { checkAIRequestLimit, trackAIRequest, MAX_FREEMIUM_REQUESTS_PER_DAY } from "@/utils/aiLimits";
import { getUserSettings } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AssistantFloating = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<string>("fr");
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });

  // Maximum number of messages to keep in memory
  const MAX_MEMORY_MESSAGES = 10;

  // Check network status periodically
  useEffect(() => {
    const checkNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? "online" : "offline");
    };

    checkNetworkStatus();
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize assistant with welcome message
  useEffect(() => {
    const loadInitialMessage = async () => {
      if (user) {
        try {
          // Try to load messages from local storage first
          const storedMessages = localStorage.getItem('assistant_messages');
          if (storedMessages) {
            const parsedMessages = JSON.parse(storedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
              setMessages(parsedMessages as Message[]);
              return;
            }
          }

          // If no stored messages, create a welcome message
          const { data } = await getUserSettings();
          const userLanguage = data?.language || 'fr';
          setLanguage(userLanguage);
          
          const welcomeMessage: Message = {
            role: "assistant",
            content: getWelcomeMessage(userLanguage),
          };
          
          setMessages([welcomeMessage]);
          localStorage.setItem('assistant_messages', JSON.stringify([welcomeMessage]));
        } catch (error) {
          console.error("Error loading language preference:", error);
          const defaultMessage: Message = {
            role: "assistant",
            content: getWelcomeMessage('fr'),
          };
          setMessages([defaultMessage]);
          localStorage.setItem('assistant_messages', JSON.stringify([defaultMessage]));
        }
      }
    };

    // Check AI usage limits
    const checkLimits = async () => {
      if (user) {
        try {
          const limits = await checkAIRequestLimit("chat");
          setRequestsInfo(limits);
        } catch (error) {
          console.error("Error checking AI usage limits:", error);
        }
      }
    };

    if (isOpen) {
      loadInitialMessage();
      checkLimits();
    }
  }, [user, isOpen]);

  // Save messages to local storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('assistant_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Welcome message based on language
  const getWelcomeMessage = (lang: string): string => {
    switch (lang) {
      case 'en':
        return "👋 **Hello!** I'm your personal AI assistant. How may I help you today?";
      case 'es':
        return "👋 **¡Hola!** Soy tu asistente de IA personal. ¿Cómo puedo ayudarte hoy?";
      case 'de':
        return "👋 **Hallo!** Ich bin Ihr persönlicher KI-Assistent. Wie kann ich Ihnen heute helfen?";
      default:
        return "👋 **Bonjour!** Je suis votre assistant IA personnel. Comment puis-je vous aider aujourd'hui?";
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!user) {
      toast({
        title: "Connexion nécessaire",
        description: "Veuillez vous connecter pour utiliser l'assistant.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has reached their limit
    try {
      const limits = await checkAIRequestLimit("chat");
      setRequestsInfo(limits);

      if (!limits.isPremium && limits.hasReachedLimit) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes. Passez à un abonnement premium pour un accès illimité.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error checking AI request limit:", error);
    }

    // Check network status
    if (networkStatus === "offline") {
      toast({
        title: "Mode Hors Ligne",
        description: "L'assistant IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité.",
        variant: "destructive",
      });
      
      setMessages(prev => [
        ...prev,
        { role: "user", content: message },
        { 
          role: "assistant", 
          content: "⚠️ **Mode hors ligne**\n\nL'assistant IA n'est pas disponible en mode hors ligne. Veuillez vous reconnecter à Internet pour utiliser cette fonctionnalité." 
        }
      ]);
      
      setMessage("");
      return;
    }

    const userMessage = message;
    setMessage("");

    // Add user message to chat
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Track this AI request
      await trackAIRequest("chat");
      
      // Use last MAX_MEMORY_MESSAGES for context
      const contextMessages = updatedMessages.slice(-MAX_MEMORY_MESSAGES);
      
      const { data, error } = await sendChatMessage(
        userMessage,
        contextMessages,
        user.id
      );

      if (error) {
        throw new Error(error);
      }

      // Update limits after successful request
      const newLimits = await checkAIRequestLimit("chat");
      setRequestsInfo(newLimits);

      // Add assistant response to chat
      const newMessages: Message[] = [
        ...updatedMessages,
        { role: "assistant", content: data.response },
      ];
      
      // Keep only last MAX_MEMORY_MESSAGES + 1 messages
      const trimmedMessages = newMessages.length > MAX_MEMORY_MESSAGES + 1 
        ? newMessages.slice(-MAX_MEMORY_MESSAGES - 1) 
        : newMessages;
      
      setMessages(trimmedMessages);
      localStorage.setItem('assistant_messages', JSON.stringify(trimmedMessages));
    } catch (error) {
      console.error("Error sending message to assistant:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la communication avec l'assistant.",
        variant: "destructive",
      });
      
      // Add error message directly to chat
      setMessages([
        ...updatedMessages,
        { 
          role: "assistant", 
          content: "❌ **Désolé, une erreur s'est produite.**\n\nJe n'ai pas pu traiter votre demande. Veuillez réessayer plus tard." 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  const clearConversation = () => {
    const welcomeMessage: Message = {
      role: "assistant",
      content: getWelcomeMessage(language),
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('assistant_messages', JSON.stringify([welcomeMessage]));
    
    toast({
      title: "Conversation effacée",
      description: "L'historique de la conversation a été effacé.",
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 shadow-lg">
          <CardHeader className="border-b p-3 flex flex-row items-center justify-between">
            <CardTitle className="text-md font-medium flex items-center">
              <Bot className="h-5 w-5 mr-2" /> Assistant IA
            </CardTitle>
            <div className="flex gap-1">
              {networkStatus === "online" ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-1">
                  <Wifi className="h-3 w-3" />
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-1">
                  <WifiOff className="h-3 w-3" />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={clearConversation}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={toggleAssistant}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] overflow-y-auto p-3 space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[85%] ${
                      msg.role === "user"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    <div
                      className={`rounded-full p-1.5 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Markdown content={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="rounded-full p-1.5 bg-muted">
                      <Bot className="h-3 w-3" />
                    </div>
                    <div className="rounded-lg p-2 bg-muted flex items-center gap-2 text-sm">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <p>L'assistant réfléchit...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Écrivez votre message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[60px] text-sm"
                  disabled={loading || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
                {requestsInfo.isPremium ? (
                  <Badge variant="outline" className="text-xs">Premium</Badge>
                ) : (
                  <p>
                    {requestsInfo.requestsToday}/{MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  ⌘+⏎ pour envoyer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg flex items-center justify-center",
            loading && "animate-pulse"
          )}
          onClick={toggleAssistant}
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default AssistantFloating;
