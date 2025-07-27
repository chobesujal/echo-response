import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type Model = 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514';

export const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>('claude-sonnet-4-20250514');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Use Puter AI API
      console.log('Sending message to Puter:', text);
      const response = await (window as any).puter.ai.chat(text, {
        model: selectedModel
      });
      
      console.log('Puter response:', response, 'Type:', typeof response);
      
      // Ensure we extract text from response object and always get a string
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object') {
        // Handle Puter's specific response format: response.message.content[0].text
        if (response.message?.content?.[0]?.text) {
          responseText = response.message.content[0].text;
        } else {
          // Fallback to other possible formats
          responseText = response.text || 
                       response.content || 
                       response.message || 
                       response.data || 
                       response.choices?.[0]?.message?.content ||
                       'No response received.';
        }
      } else if (response === null || response === undefined) {
        responseText = 'No response received.';
      } else {
        responseText = String(response);
      }
      
      console.log('Final response text:', responseText, 'Type:', typeof responseText);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Puter AI Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };


  const clearChat = () => {
    setMessages([{
      id: "welcome",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }]);
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto shadow-card">
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-primary rounded-t-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-primary-foreground">AI Chat Assistant</h2>
          <Select value={selectedModel} onValueChange={(value: Model) => setSelectedModel(value)}>
            <SelectTrigger className="w-40 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
              <SelectItem value="claude-opus-4-20250514">Claude 4 Opus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="text-sm text-primary-foreground/80">
            {messages.length - 1} messages
          </div>
        </div>
      </div>
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </Card>
  );
};