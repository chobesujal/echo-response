import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { EnhancedChatInput } from './EnhancedChatInput';
import { 
  Sparkles,
  MessageSquare,
  Bot,
  Palette,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { puterService } from '../lib/puterService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
  type?: 'text' | 'image' | 'error';
  imageUrl?: string;
}

interface EnhancedChatContainerProps {
  currentChatId?: string;
  selectedModel?: string;
  onChatUpdate?: (chatId: string, title: string, messageCount: number) => void;
}

const MODEL_CATEGORIES = {
  'Text Generation': [
    { id: 'gpt-5-chat-latest', name: 'GPT-5 Latest', provider: 'OpenAI', status: 'live' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', status: 'live' },
    { id: 'o1', name: 'o1', provider: 'OpenAI', status: 'live' },
    { id: 'o1-pro', name: 'o1 Pro', provider: 'OpenAI', status: 'live' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: 'live' },
    { id: 'claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', status: 'live' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', status: 'live' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', status: 'live' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', status: 'live' },
    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B', provider: 'Meta', status: 'live' },
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B', provider: 'Meta', status: 'live' },
    { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral', status: 'live' }
  ],
  'Image Generation': [
    { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', status: 'live' }
  ],
  'Code Generation': [
    { id: 'gpt-4o', name: 'GPT-4o (Code)', provider: 'OpenAI', status: 'live' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Code)', provider: 'Anthropic', status: 'live' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat (Code)', provider: 'DeepSeek', status: 'live' }
  ]
};

export function EnhancedChatContainer({ currentChatId, selectedModel = 'deepseek-chat', onChatUpdate }: EnhancedChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Sync internal state with prop changes
  useEffect(() => {
    setCurrentModel(selectedModel);
  }, [selectedModel]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history when currentChatId changes
    const loadChatHistory = () => {
      if (!currentChatId) {
        setMessages([]);
        return;
      }
      
      try {
        const savedMessages = localStorage.getItem(`chat-messages-${currentChatId}`);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([]);
      }
    };

    loadChatHistory();
  }, [currentChatId]);

  const saveChatHistory = (updatedMessages: Message[]) => {
    if (!currentChatId) return;
    
    try {
      // Save messages for this specific chat
      localStorage.setItem(`chat-messages-${currentChatId}`, JSON.stringify(updatedMessages));
      
      // Update chat sessions list
      const savedSessions = localStorage.getItem('chat-sessions');
      const sessions = savedSessions ? JSON.parse(savedSessions) : [];
      
      const sessionIndex = sessions.findIndex((s: any) => s.id === currentChatId);
      const sessionData = {
        id: currentChatId,
        title: updatedMessages[0]?.content.slice(0, 50) || 'New Chat',
        lastUpdated: new Date().toISOString(),
        messageCount: updatedMessages.length,
        model: currentModel
      };

      if (sessionIndex >= 0) {
        sessions[sessionIndex] = sessionData;
      } else {
        sessions.unshift(sessionData);
      }

      localStorage.setItem('chat-sessions', JSON.stringify(sessions));
      
      // Notify parent component
      if (onChatUpdate) {
        onChatUpdate(currentChatId, sessionData.title, updatedMessages.length);
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const handleSendMessage = async (messageText: string, files?: File[], mode?: 'thinking' | 'search' | 'normal') => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText.trim(),
      sender: 'user',
      timestamp: new Date(),
      model: selectedModel
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await puterService.chat(userMessage.content, {
        model: currentModel,
        max_tokens: 2000,
        temperature: 0.7,
        memory: true
      }, sessionId);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date(),
        model: currentModel,
        type: 'text'
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      toast({
        title: "Message sent",
        description: "Response received successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'assistant',
        timestamp: new Date(),
        model: currentModel,
        type: 'error'
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateResponse = async (messageIndex: number) => {
    if (messageIndex <= 0 || isLoading) return;

    const userMessage = messages[messageIndex - 1];
    if (userMessage.sender !== 'user') return;

    setIsLoading(true);

    try {
      const response = await puterService.chat(userMessage.content, {
        model: currentModel,
        max_tokens: 2000,
        temperature: 0.7,
        memory: true
      }, sessionId);

      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: response,
        timestamp: new Date(),
        model: currentModel,
        type: 'text'
      };

      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);

      toast({
        title: "Response regenerated",
        description: "New response generated successfully",
      });
    } catch (error) {
      console.error('Error regenerating response:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (currentChatId) {
      localStorage.removeItem(`chat-messages-${currentChatId}`);
    }
    toast({
      title: "Chat cleared",
      description: "All messages have been removed.",
    });
  };

  const getModelBadgeColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'beta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Mount models menu in the designated container
  useEffect(() => {
    const container = document.getElementById('models-menu-container');
    if (container) {
      const modelSelect = (
        <Select value={currentModel} onValueChange={setCurrentModel}>
          <SelectTrigger className="w-full bg-[#020105]/80 border-[#FFFAFA]/20 text-[#FFFAFA] hover:bg-[#FFFAFA]/10">
            <SelectValue placeholder="Select AI Model" />
          </SelectTrigger>
          <SelectContent className="bg-[#020105]/95 border-[#FFFAFA]/30 backdrop-blur-md">
            {Object.entries(MODEL_CATEGORIES).map(([category, models]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-[#FFFAFA]/60 uppercase tracking-wider">
                  {category}
                </div>
                {models.map((model) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className="text-[#FFFAFA] hover:bg-[#FFFAFA]/10 focus:bg-[#FFFAFA]/10"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-[#FFFAFA]/60">{model.provider}</span>
                      </div>
                      <Badge className={`ml-2 text-xs ${getModelBadgeColor(model.status)}`}>
                        {model.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      );
      
      // This would need to be rendered using a portal or similar React mechanism
      // For now, we'll handle it in the Layout component
    }
  });

  return (
    <div className="flex flex-col h-screen bg-[#020105]">
      {/* Models Menu - Now handled by Layout component */}
      <div className="hidden">
        <Select value={currentModel} onValueChange={setCurrentModel}>
          <SelectTrigger className="w-64 bg-[#020105]/80 border-[#FFFAFA]/30 text-[#FFFAFA] backdrop-blur-sm">
            <SelectValue placeholder="Select AI Model" />
          </SelectTrigger>
          <SelectContent className="bg-[#020105]/95 border-[#FFFAFA]/30">
            {Object.entries(MODEL_CATEGORIES).map(([category, models]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-[#FFFAFA]/60 uppercase tracking-wider">
                  {category}
                </div>
                {models.map((model) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className="text-[#FFFAFA] hover:bg-[#FFFAFA]/10 focus:bg-[#FFFAFA]/10"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-[#FFFAFA]/60">{model.provider}</span>
                      </div>
                      <Badge className={`ml-2 text-xs ${getModelBadgeColor(model.status)}`}>
                        {model.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 px-4 pt-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#FFFAFA] mb-2">
                Welcome to Cosmic AI
              </h3>
              <p className="text-[#FFFAFA]/70 mb-6">
                Start a conversation with our advanced AI models
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-[#020105]/50 border-[#FFFAFA]/30 hover:bg-[#FFFAFA]/10"
                  onClick={() => handleSendMessage("Explain quantum computing in simple terms")}
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-blue-400" />
                  <div>
                    <div className="font-medium text-[#FFFAFA]">Ask about science</div>
                    <div className="text-sm text-[#FFFAFA]/60">Explain quantum computing</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-[#020105]/50 border-[#FFFAFA]/30 hover:bg-[#FFFAFA]/10"
                  onClick={() => handleSendMessage("Write a Python function to sort a list")}
                >
                  <Bot className="w-4 h-4 mr-3 text-green-400" />
                  <div>
                    <div className="font-medium text-[#FFFAFA]">Code assistance</div>
                    <div className="text-sm text-[#FFFAFA]/60">Write Python function</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-[#020105]/50 border-[#FFFAFA]/30 hover:bg-[#FFFAFA]/10"
                  onClick={() => handleSendMessage("Help me plan a trip to Japan")}
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-orange-400" />
                  <div>
                    <div className="font-medium text-[#FFFAFA]">Get advice</div>
                    <div className="text-sm text-[#FFFAFA]/60">Plan a trip to Japan</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-400/30 hover:bg-purple-500/20"
                  onClick={() => window.location.href = 'https://cosmic-image.vercel.app'}
                >
                  <Palette className="w-4 h-4 mr-3 text-purple-400" />
                  <div>
                    <div className="font-medium text-[#FFFAFA]">Generate Images</div>
                    <div className="text-sm text-[#FFFAFA]/60">Open DALL-E Studio</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id}>
                <ChatMessage
                  message={message.content}
                  isUser={message.sender === 'user'}
                  timestamp={message.timestamp}
                  model={message.model}
                  onRegenerate={() => handleRegenerateResponse(index)}
                  showRegenerate={message.sender === 'assistant' && index === messages.length - 1}
                />
              </div>
            ))
          )}
          
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Chat Input */}
      <div className="border-t border-[#FFFAFA]/20 bg-[#020105]/90 backdrop-blur-md">
        <EnhancedChatInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}