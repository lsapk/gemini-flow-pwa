
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizonal, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sendChatMessage } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import { checkAIRequestLimit, trackAIRequest, MAX_FREEMIUM_REQUESTS_PER_DAY } from "@/utils/aiLimits";
import { getUserSettings } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Assistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<string>("fr");
  const [requestsInfo, setRequestsInfo] = useState<{
    hasReachedLimit: boolean;
    requestsToday: number;
    isPremium: boolean;
  }>({ hasReachedLimit: false, requestsToday: 0, isPremium: false });

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Add initial assistant message based on language preference
    const loadInitialMessage = async () => {
      if (user) {
        try {
          const { data } = await getUserSettings();
          const userLanguage = data?.language || 'fr';
          setLanguage(userLanguage);
          setMessages([
            {
              role: "assistant",
              content: getWelcomeMessage(userLanguage),
            },
          ]);
        } catch (error) {
          console.error("Error loading language preference:", error);
          setMessages([
            {
              role: "assistant",
              content: getWelcomeMessage('fr'),
            },
          ]);
        }
      } else {
        setMessages([
          {
            role: "assistant",
            content: getWelcomeMessage('fr'),
          },
        ]);
      }
    };

    // Check AI request limits
    const checkLimits = async () => {
      if (user) {
        try {
          const limits = await checkAIRequestLimit("chat");
          setRequestsInfo(limits);
        } catch (error) {
          console.error("Error checking AI limits:", error);
          toast({
            title: "Erreur",
            description: "Impossible de vérifier les limites d'utilisation de l'IA.",
            variant: "destructive",
          });
        }
      }
    };

    loadInitialMessage();
    checkLimits();
  }, [user, toast]);

  // Function to get welcome message based on language
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

    // Check if user has reached the limit
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

    const userMessage = message;
    setMessage("");

    // Add user message to the chat
    const updatedMessages = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Track this AI request before making the call
      await trackAIRequest("chat");
      
      const { data, error } = await sendChatMessage(
        userMessage,
        updatedMessages,
        user.id
      );

      if (error) {
        throw new Error(error);
      }

      // Update limits after successful request
      const newLimits = await checkAIRequestLimit("chat");
      setRequestsInfo(newLimits);

      // Add assistant response to the chat
      setMessages([
        ...updatedMessages,
        { role: "assistant" as const, content: data.response },
      ]);
    } catch (error) {
      console.error("Error sending message to assistant:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la communication avec l'assistant.",
        variant: "destructive",
      });
      // Add error message directly to the chat
      setMessages([
        ...updatedMessages,
        { 
          role: "assistant" as const, 
          content: "❌ **Désolé, une erreur s'est produite.**\n\nJe n'ai pas pu traiter votre demande. Veuillez réessayer plus tard." 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Assistant IA
        </h1>
        <p className="text-muted-foreground">
          Discutez avec votre assistant virtuel et obtenez de l'aide pour vos différentes tâches.
        </p>
      </div>

      {!requestsInfo.isPremium && (
        <Alert variant={requestsInfo.hasReachedLimit ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compte Freemium</AlertTitle>
          <AlertDescription>
            {requestsInfo.hasReachedLimit
              ? `Vous avez atteint votre limite de ${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes. Passez à un abonnement premium pour un accès illimité.`
              : `Vous avez utilisé ${requestsInfo.requestsToday}/${MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes quotidiennes.`}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle className="text-lg font-medium">Discussion</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[80%] ${
                    msg.role === "user"
                      ? "flex-row-reverse"
                      : "flex-row"
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
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
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="rounded-full p-2 bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>L'assistant réfléchit...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4">
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
                className="min-h-[60px]"
                disabled={loading || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
            {requestsInfo.isPremium ? (
              <Badge variant="outline" className="mt-2">Premium</Badge>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {requestsInfo.requestsToday}/{MAX_FREEMIUM_REQUESTS_PER_DAY} requêtes aujourd'hui
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assistant;
