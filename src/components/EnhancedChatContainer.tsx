import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Copy, Download, Share, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  model?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  messageCount: number;
}

type Model = 'deepseek-reasoner' | 'deepseek-chat' | 'gemini-2.0-flash' | 'claude-3-5-sonnet' | 'claude-3-opus' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

const modelDisplayNames: Record<Model, string> = {
  'deepseek-reasoner': 'DeepSeek R1 (Reasoning)',
  'deepseek-chat': 'DeepSeek V3 (Chat)',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
  'claude-3-opus': 'Claude 3 Opus',
  'gpt-4': 'GPT-4',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo'
};

const modelCategories = {
  'Premium Reasoning': ['deepseek-reasoner', 'claude-3-opus', 'gpt-4'],
  'Fast & Efficient': ['deepseek-chat', 'gemini-2.0-flash', 'claude-3-5-sonnet', 'gpt-4-turbo'],
  'Budget Friendly': ['gpt-3.5-turbo']
};

interface EnhancedChatContainerProps {
  currentChatId?: string;
  onChatUpdate?: (chatId: string, title: string, messageCount: number) => void;
}

export const EnhancedChatContainer = ({ currentChatId, onChatUpdate }: EnhancedChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI assistant. I can help with coding, writing, analysis, and much more. Choose your preferred model and let's start chatting!",
      isUser: false,
      timestamp: new Date(),
      model: 'system'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>('deepseek-reasoner');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
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
  }, [messages, isTyping, streamingText]);

  useEffect(() => {
    if (currentChatId) {
      loadChat(currentChatId);
    }
  }, [currentChatId]);

  const loadChat = (chatId: string) => {
    try {
      const savedChats = localStorage.getItem('chat-sessions');
      if (savedChats) {
        const sessions: ChatSession[] = JSON.parse(savedChats);
        const session = sessions.find(s => s.id === chatId);
        if (session) {
          const messagesWithDates = session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        }
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive"
      });
    }
  };

  const saveChat = (updatedMessages: Message[]) => {
    try {
      const chatSession: ChatSession = {
        id: currentChatId || Date.now().toString(),
        title: generateChatTitle(updatedMessages),
        messages: updatedMessages,
        timestamp: new Date(),
        messageCount: updatedMessages.filter(m => m.id !== 'welcome').length
      };

      const savedChats = localStorage.getItem('chat-sessions');
      let sessions: ChatSession[] = savedChats ? JSON.parse(savedChats) : [];
      
      const existingIndex = sessions.findIndex(s => s.id === chatSession.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = chatSession;
      } else {
        sessions.unshift(chatSession);
      }

      // Keep only last 50 sessions
      sessions = sessions.slice(0, 50);
      
      localStorage.setItem('chat-sessions', JSON.stringify(sessions));
      
      // Update chat history in sidebar
      const historyItems = sessions.map(s => ({
        id: s.id,
        title: s.title,
        timestamp: s.timestamp,
        messageCount: s.messageCount
      }));
      localStorage.setItem('chat-history', JSON.stringify(historyItems));
      
      onChatUpdate?.(chatSession.id, chatSession.title, chatSession.messageCount);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const generateChatTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(m => m.isUser);
    if (firstUserMessage) {
      const title = firstUserMessage.text.slice(0, 50);
      return title.length === 50 ? title + "..." : title;
    }
    return `Chat ${new Date().toLocaleString()}`;
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      model: selectedModel
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setIsStreaming(true);
    setStreamingText("");

    try {
      console.log('Sending message to AI:', text, 'Model:', selectedModel);
      
      // Get recent context (last 10 messages)
      const recentMessages = updatedMessages.slice(-10);
      const contextMessages = recentMessages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        }));

      let response;
      
      // Use different APIs based on model selection
      if (selectedModel.startsWith('deepseek') || selectedModel === 'gemini-2.0-flash') {
        // Use Puter for supported models
        response = await (window as any).puter.ai.chat(text, {
          model: selectedModel,
          context: contextMessages,
          max_tokens: 2000,
          temperature: 0.7
        });
      } else {
        // For Claude and GPT models, simulate response (you'd integrate actual APIs here)
        response = await simulateAIResponse(text, selectedModel);
      }
      
      console.log('AI Response:', response);
      
      let responseText = extractResponseText(response);
      
      // Simulate streaming effect for better UX
      await streamResponse(responseText);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        model: selectedModel
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      saveChat(finalMessages);
      
    } catch (error) {
      console.error('AI Error:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I encountered an error with the ${modelDisplayNames[selectedModel]} model. This might be due to:\n\n• Model temporarily unavailable\n• Network connectivity issues\n• API rate limits\n\nPlease try again or select a different model.`,
        isUser: false,
        timestamp: new Date(),
        model: 'error'
      };
      
      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      
      toast({
        title: "AI Response Error",
        description: `Failed to get response from ${modelDisplayNames[selectedModel]}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const extractResponseText = (response: any): string => {
    if (typeof response === 'string') {
      return response;
    } else if (response && typeof response === 'object') {
      if (response.message?.content) {
        return response.message.content;
      } else if (response.message?.content?.[0]?.text) {
        return response.message.content[0].text;
      } else {
        return response.text || 
               response.content || 
               response.message || 
               response.data || 
               response.choices?.[0]?.message?.content ||
               'No response received.';
      }
    }
    return String(response) || 'No response received.';
  };

  const simulateAIResponse = async (prompt: string, model: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      `I understand you're asking about: "${prompt.slice(0, 50)}..."\n\nAs ${modelDisplayNames[model as Model]}, I'd be happy to help you with this. However, I should note that this is a simulated response since the actual API integration for this model would require proper authentication and configuration.\n\nTo fully implement ${model}, you would need to:\n1. Set up the appropriate API credentials\n2. Configure the model endpoint\n3. Handle authentication and rate limiting\n\nIs there something specific about this topic I can help clarify?`,
      
      `Thank you for your question about "${prompt.slice(0, 40)}..."\n\nI'm currently running in demo mode for ${modelDisplayNames[model as Model]}. In a production environment, this model would provide detailed, contextual responses based on its training and capabilities.\n\nWould you like me to explain how to properly integrate this model, or would you prefer to try one of the working models like DeepSeek or Gemini?`,
      
      `Interesting question! While I can simulate a response from ${modelDisplayNames[model as Model]}, for the full experience you'd want to connect to the actual API.\n\nThis model is particularly good at:\n• Complex reasoning tasks\n• Code generation and debugging\n• Creative writing and analysis\n• Multi-step problem solving\n\nWhat specific aspect of your question would you like me to focus on?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const streamResponse = async (text: string) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      setStreamingText(words.slice(0, i + 1).join(' '));
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: "welcome",
      text: "Hello! I'm your AI assistant. I can help with coding, writing, analysis, and much more. Choose your preferred model and let's start chatting!",
      isUser: false,
      timestamp: new Date(),
      model: 'system'
    };
    setMessages([welcomeMessage]);
    setStreamingText("");
  };

  const regenerateLastResponse = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.isUser);
    if (lastUserMessage) {
      // Remove last AI response
      // Find last user message index
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].isUser) {
          lastUserIndex = i;
          break;
        }
      }
      const messagesUpToLastUser = messages.slice(0, lastUserIndex + 1);
      setMessages(messagesUpToLastUser);
      
      // Regenerate response
      await handleSendMessage(lastUserMessage.text);
    }
  };

  const copyChat = () => {
    const chatText = messages
      .filter(m => m.id !== 'welcome')
      .map(m => `${m.isUser ? 'You' : `AI (${m.model})`}: ${m.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(chatText);
    toast({
      title: "Chat copied",
      description: "Chat history has been copied to clipboard."
    });
  };

  const exportChat = () => {
    const chatData = {
      title: generateChatTitle(messages),
      timestamp: new Date(),
      model: selectedModel,
      messages: messages.filter(m => m.id !== 'welcome')
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chat-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Chat exported",
      description: "Chat has been downloaded as JSON file."
    });
  };

  const shareChat = async () => {
    const chatText = messages
      .filter(m => m.id !== 'welcome')
      .map(m => `${m.isUser ? 'You' : 'AI'}: ${m.text}`)
      .join('\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Chat Conversation',
          text: chatText
        });
      } catch (error) {
        copyChat(); // Fallback to copy
      }
    } else {
      copyChat(); // Fallback to copy
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-card">
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-primary rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
            <h2 className="text-lg font-semibold text-primary-foreground">AI Chat Assistant</h2>
          </div>
          <Select value={selectedModel} onValueChange={(value: Model) => setSelectedModel(value)}>
            <SelectTrigger className="w-56 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modelCategories).map(([category, models]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center justify-between w-full">
                        <span>{modelDisplayNames[model as Model]}</span>
                        {(model === 'deepseek-reasoner' || model === 'deepseek-chat' || model === 'gemini-2.0-flash') && (
                          <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={regenerateLastResponse}
            disabled={isTyping || messages.filter(m => m.isUser).length === 0}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyChat}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={exportChat}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={shareChat}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Share className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="text-sm text-primary-foreground/80">
            {messages.filter(m => m.id !== 'welcome').length} messages
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
              model={message.model}
            />
          ))}
          {isTyping && !isStreaming && <TypingIndicator />}
          {isStreaming && streamingText && (
            <ChatMessage
              message={streamingText}
              isUser={false}
              timestamp={new Date()}
              model={selectedModel}
              isStreaming={true}
            />
          )}
        </div>
      </ScrollArea>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </Card>
  );
};
