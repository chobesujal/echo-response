import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { EnhancedChatInput } from './EnhancedChatInput';
import { 
  Sparkles,
  MessageSquare,
  Palette,
  Brain,
  Code,
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
  isStreaming?: boolean;
}

interface EnhancedChatContainerProps {
  currentChatId?: string;
  selectedModel?: string;
  onChatUpdate?: (chatId: string, title: string, messageCount: number) => void;
}

export function EnhancedChatContainer({ currentChatId, selectedModel = 'gpt-4o', onChatUpdate }: EnhancedChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
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

  // Check if model supports streaming
  const supportsStreaming = (modelId: string): boolean => {
    const streamingModels = [
      'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022',
      'gemini-1.5-flash', 'gemini-1.5-pro', 'deepseek-chat', 'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma-7b-it', 'qwen2.5-72b-instruct',
      'command-r-plus', 'grok-2-1212', 'grok-vision-beta'
    ];
    
    return streamingModels.includes(modelId);
  };

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

    console.log('EnhancedChatContainer: Sending message:', messageText);
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

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      model: currentModel,
      type: 'text',
      isStreaming: true
    };

    try {
      if (supportsStreaming(currentModel)) {
        console.log('Using streaming for model:', currentModel);
        
        // Add streaming message placeholder
        const messagesWithPlaceholder = [...updatedMessages, assistantMessage];
        setMessages(messagesWithPlaceholder);
        setStreamingMessageId(assistantMessageId);
        
        let accumulatedContent = '';
        
        await puterService.chatStream(
          userMessage.content,
          {
            model: currentModel,
            max_tokens: 2000,
            temperature: 0.7
          },
          (chunk: string) => {
            accumulatedContent += chunk;
            
            // Update the streaming message
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: accumulatedContent, isStreaming: true }
                : msg
            ));
          },
          sessionId
        );
        
        // Finalize the message
        const finalMessages = messagesWithPlaceholder.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: accumulatedContent, isStreaming: false }
            : msg
        );
        
        setMessages(finalMessages);
        saveChatHistory(finalMessages);
        setStreamingMessageId(null);
      } else {
        console.log('Using regular chat for model:', currentModel);
        
        const response = await puterService.chat(userMessage.content, {
          model: currentModel,
          max_tokens: 2000,
          temperature: 0.7
        }, sessionId);
        
        const finalAssistantMessage: Message = {
          id: assistantMessageId,
          content: response,
          sender: 'assistant',
          timestamp: new Date(),
          model: currentModel,
          type: 'text'
        };

        const finalMessages = [...updatedMessages, finalAssistantMessage];
        setMessages(finalMessages);
        saveChatHistory(finalMessages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: assistantMessageId,
        content: `I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'assistant',
        timestamp: new Date(),
        model: currentModel,
        type: 'error'
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      setStreamingMessageId(null);
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
  };

  return (
    <div className="flex flex-col h-screen bg-[#020105]">

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
                  onClick={() => handleSendMessage("Explain quantum computing in simple terms", [], 'thinking')}
                >
                  <Brain className="w-4 h-4 mr-3 text-blue-400" />
                  <div>
                    <div className="font-medium text-[#FFFAFA]">Ask about science</div>
                    <div className="text-sm text-[#FFFAFA]/60">Explain quantum computing</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-[#020105]/50 border-[#FFFAFA]/30 hover:bg-[#FFFAFA]/10"
                  onClick={() => handleSendMessage("Write a Python function to sort a list", [], 'normal')}
                >
                  <Code className="w-4 h-4 mr-3 text-green-400" />
                  <div>
                    <div className="font-medium text-[#FFFAFA]">Code assistance</div>
                    <div className="text-sm text-[#FFFAFA]/60">Write Python function</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-[#020105]/50 border-[#FFFAFA]/30 hover:bg-[#FFFAFA]/10"
                  onClick={() => handleSendMessage("Help me plan a trip to Japan", [], 'search')}
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
                  onClick={() => window.open('/dalle', '_blank')}
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
                  isStreaming={message.isStreaming}
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