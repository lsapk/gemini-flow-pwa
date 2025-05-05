
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizonal, Bot, User, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
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

  // Vérification périodique du statut réseau
  useEffect(() => {
    const checkNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? "online" : "offline");
    };

    // Vérifier immédiatement
    checkNetworkStatus();

    // Écouter les changements de statut réseau
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  useEffect(() => {
    // Scroll vers le bas quand les messages changent
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Ajouter un message initial de l'assistant basé sur la préférence de langue
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
          console.error("Erreur lors du chargement de la préférence de langue:", error);
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

    // Vérifier les limites d'utilisation de l'IA
    const checkLimits = async () => {
      if (user) {
        try {
          const limits = await checkAIRequestLimit("chat");
          setRequestsInfo(limits);
        } catch (error) {
          console.error("Erreur lors de la vérification des limites d'utilisation de l'IA:", error);
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

  // Fonction pour obtenir le message de bienvenue en fonction de la langue
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

    // Vérifier si l'utilisateur a atteint sa limite
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
      console.error("Erreur lors de la vérification de la limite de requêtes IA:", error);
    }

    // Vérifier l'état du réseau
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

    // Ajouter le message de l'utilisateur au chat
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Suivre cette requête IA avant d'effectuer l'appel
      await trackAIRequest("chat");
      
      const { data, error } = await sendChatMessage(
        userMessage,
        updatedMessages,
        user.id
      );

      if (error) {
        throw new Error(error);
      }

      // Mettre à jour les limites après une requête réussie
      const newLimits = await checkAIRequestLimit("chat");
      setRequestsInfo(newLimits);

      // Ajouter la réponse de l'assistant au chat
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message à l'assistant:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la communication avec l'assistant.",
        variant: "destructive",
      });
      // Ajouter un message d'erreur directement dans le chat
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

      {networkStatus === "offline" && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Mode hors ligne</AlertTitle>
          <AlertDescription>
            L'assistant IA n'est pas disponible en mode hors ligne. Certaines fonctionnalités sont limitées.
          </AlertDescription>
        </Alert>
      )}

      {networkStatus === "online" && !requestsInfo.isPremium && (
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
        <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Discussion</CardTitle>
          {networkStatus === "online" ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Wifi className="mr-1 h-3 w-3"/> En ligne
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              <WifiOff className="mr-1 h-3 w-3"/> Hors ligne
            </Badge>
          )}
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
                disabled={loading || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading || networkStatus === "offline" || (requestsInfo.hasReachedLimit && !requestsInfo.isPremium)}
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
