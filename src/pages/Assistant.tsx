
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuitIcon } from "@/components/icons/DeepFlowIcons";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { SendIcon, PaperclipIcon, MicIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { sendChatMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant IA DeepFlow. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Check authentication
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Non connecté",
        description: "Veuillez vous connecter pour utiliser l'assistant IA."
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Format chat history for the API
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the Gemini API via our Supabase Edge Function
      const { data, error } = await sendChatMessage(input, chatHistory);
      
      if (error) {
        throw new Error(error.message);
      }

      // Add AI response
      const aiResponse: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response,
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error calling AI assistant:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de contacter l'assistant IA. Veuillez réessayer."
      });
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Je suis désolé, j'ai rencontré une erreur de connexion. Veuillez réessayer plus tard.",
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
          Discutez avec votre assistant personnel pour obtenir des conseils et de l'aide.
        </p>
      </div>

      <Card className="glass-card h-[calc(100vh-250px)] flex flex-col">
        <CardHeader>
          <CardTitle>Conversation avec DeepFlow IA</CardTitle>
          <CardDescription>
            Posez vos questions sur la productivité, les habitudes ou la gestion du temps.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col overflow-hidden p-0">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mr-2">
                    <div className="relative w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                      <BrainCircuitIcon className="h-5 w-5 text-primary" />
                    </div>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 ml-2">
                    <div className="relative w-full h-full rounded-full bg-primary flex items-center justify-center text-white">
                      {isAuthenticated ? "U" : "?"}
                    </div>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Avatar className="h-8 w-8 mr-2">
                  <div className="relative w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                    <BrainCircuitIcon className="h-5 w-5 text-primary" />
                  </div>
                </Avatar>
                <div className="flex items-center space-x-2 bg-secondary rounded-2xl p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={() => toast({
                  title: "Fonctionnalité en développement",
                  description: "L'envoi de fichiers sera disponible prochainement."
                })}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-grow rounded-full"
                disabled={isLoading || !isAuthenticated}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={() => toast({
                  title: "Fonctionnalité en développement",
                  description: "La saisie vocale sera disponible prochainement."
                })}
              >
                <MicIcon className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full" 
                disabled={!input.trim() || isLoading || !isAuthenticated}
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assistant;
