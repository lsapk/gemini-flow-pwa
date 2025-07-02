
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Send, Bot, User } from 'lucide-react';
import { useAIAssistantEnhanced } from '@/hooks/useAIAssistantEnhanced';
import { cn } from '@/lib/utils';

export const AIAssistantEnhanced: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage } = useAIAssistantEnhanced();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Assistant IA Amélioré
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 p-3 rounded-lg",
                message.role === 'user' 
                  ? "bg-blue-50 ml-8" 
                  : "bg-gray-50 mr-8"
              )}
            >
              <div className="flex-shrink-0">
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : (
                  <Bot className="w-5 h-5 text-green-600" />
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.actionButtons && message.actionButtons.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {message.actionButtons.map((button) => (
                      <Button
                        key={button.id}
                        onClick={button.action}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 p-3 rounded-lg bg-gray-50 mr-8">
              <Bot className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Demandez-moi de créer des tâches, habitudes, objectifs..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
