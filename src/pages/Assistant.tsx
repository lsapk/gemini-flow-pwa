
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuitIcon } from "@/components/icons/DeepFlowIcons";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { SendIcon } from "lucide-react";

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

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Je suis une version de démonstration de l'assistant IA. Je serai connecté à Gemini dans une version future pour vous fournir de véritables conseils personnalisés.",
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      setIsLoading(false);
    }, 1500);
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
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-secondary rounded-2xl p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex space-x-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-grow"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
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
