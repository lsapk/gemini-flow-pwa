
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrainCircuitIcon, SendIcon, AlertTriangleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendChatMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Markdown } from "@/components/Markdown";

// Define message type
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initial welcome message from assistant
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "## 👋 Bonjour!\n\nJe suis DeepFlow AI, votre assistant personnel. Comment puis-je vous aider aujourd'hui ?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour utiliser l'assistant.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, toast, navigate]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    setError(null);
    setLimitExceeded(false);

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      if (!user) {
        throw new Error("Vous devez être connecté pour utiliser l'assistant");
      }

      // Format chat history for the API
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send message to API
      const { data, error, status } = await sendChatMessage(input.trim(), chatHistory, user.id);

      if (status === 429) {
        setLimitExceeded(true);
        // Add the limit exceeded message from the API response
        const limitMessage: Message = {
          id: Date.now().toString() + "-limit",
          role: "assistant",
          content: data.response || "Vous avez atteint votre limite quotidienne de requêtes gratuites. Passez à la version premium pour un accès illimité.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, limitMessage]);
        return;
      }

      if (error) {
        throw new Error(error.message);
      }

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'obtenir une réponse. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BrainCircuitIcon className="h-8 w-8" />
          Assistant IA
        </h1>
        <p className="text-muted-foreground">
          Votre assistant intelligent personnel pour vous aider dans votre quotidien.
        </p>
      </div>

      {limitExceeded && (
        <Alert variant="warning" className="bg-amber-50 dark:bg-amber-900/30 border-amber-300">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Limite atteinte</AlertTitle>
          <AlertDescription>
            Vous avez atteint votre limite quotidienne de 5 requêtes gratuites. Passez à la version premium pour un accès illimité.
          </AlertDescription>
        </Alert>
      )}

      <Card className="glass-card shadow-md">
        <CardHeader>
          <CardTitle>DeepFlow AI</CardTitle>
          <CardDescription>
            Posez vos questions ou demandez de l'aide pour votre productivité.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 mb-4 max-h-[60vh] overflow-y-auto p-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-primary" : "bg-secondary"}`}>
                    <AvatarFallback>
                      {message.role === "user" ? "U" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Markdown content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <Avatar className="h-8 w-8 bg-secondary">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-4 bg-secondary">
                    <div className="flex space-x-1.5">
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0s" }}></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tapez votre message..."
              disabled={isProcessing || limitExceeded}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isProcessing || limitExceeded}
              size="icon"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assistant;
