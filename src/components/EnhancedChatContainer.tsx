import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { EnhancedChatInput } from "./EnhancedChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Copy, Download, Share, Sparkles, Settings, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { puterService } from "@/lib/puterService";
import { VoiceSettings } from "./VoiceSettings";

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

type Model = 
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt-4-turbo' 
  | 'gpt-3.5-turbo'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-5-chat-latest'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4.5-preview'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-sonnet-4'
  | 'claude-opus-4'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash-exp'
  | 'deepseek-r1'
  | 'deepseek-v3'
  | 'llama-3.1-405b'
  | 'llama-3.1-70b'
  | 'llama-3.1-8b';

const modelDisplayNames: Record<Model, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'gpt-5': 'GPT-5',
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-5-nano': 'GPT-5 Nano',
  'gpt-5-chat-latest': 'GPT-5 Chat Latest',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 Mini',
  'gpt-4.1-nano': 'GPT-4.1 Nano',
  'gpt-4.5-preview': 'GPT-4.5 Preview',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'claude-sonnet-4': 'Claude Sonnet 4',
  'claude-opus-4': 'Claude Opus 4',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'deepseek-r1': 'DeepSeek R1',
  'deepseek-v3': 'DeepSeek V3',
  'llama-3.1-405b': 'Llama 3.1 405B',
  'llama-3.1-70b': 'Llama 3.1 70B',
  'llama-3.1-8b': 'Llama 3.1 8B'
};

const modelCategories = {
  'GPT-5 Series': ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-chat-latest'],
  'GPT-4 Series': ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4.5-preview', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  'Claude-4 Series': ['claude-sonnet-4', 'claude-opus-4'],
  'Claude-3 Series': ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  'Google': ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
  'DeepSeek': ['deepseek-r1', 'deepseek-v3'],
  'Meta': ['llama-3.1-405b', 'llama-3.1-70b', 'llama-3.1-8b']
};

interface EnhancedChatContainerProps {
  currentChatId?: string;
  onChatUpdate?: (chatId: string, title: string, messageCount: number) => void;
}

export const EnhancedChatContainer = ({
  currentChatId,
  onChatUpdate
}: EnhancedChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    text: "Hello! I'm Cosmic AI, your advanced AI assistant powered by multiple AI models. I can help with coding, writing, analysis, creative tasks, and much more. How can I assist you today?",
    isUser: false,
    timestamp: new Date(),
    model: 'system'
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>('deepseek-v3');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  const [streamingText, setStreamingText] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 50);
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

      sessions = sessions.slice(0, 50);
      localStorage.setItem('chat-sessions', JSON.stringify(sessions));

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

  const handleSendMessage = async (text: string, files?: File[], mode?: 'thinking' | 'search' | 'normal') => {
    if (!text.trim() && (!files || files.length === 0)) return;

    let messageText = text;
    let processedFiles: any[] = [];

    // Handle file uploads
    if (files && files.length > 0) {
      const readFileText = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsText(file);
        });

      for (const file of files) {
        try {
          if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            try {
              const imageDescription = await puterService.imageToText(imageUrl, `Describe this image in detail: ${file.name}`);
              processedFiles.push({
                type: 'text',
                text: `[Image: ${file.name}] ${imageDescription}`
              });
            } catch (error) {
              processedFiles.push({
                type: 'text',
                text: `[Image: ${file.name}] - Unable to process image`
              });
            }
            URL.revokeObjectURL(imageUrl);
          } else if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md')) {
            const content = await readFileText(file);
            const preview = content.slice(0, 4000);
            processedFiles.push({
              type: 'text',
              text: `[File: ${file.name}]\n${preview}${content.length > 4000 ? '\n...[truncated]' : ''}`
            });
          } else {
            processedFiles.push({
              type: 'text',
              text: `[File: ${file.name} | ${file.type || 'unknown'} | ${Math.round(file.size/1024)}KB]\nFile uploaded but content extraction not available for this file type.`
            });
          }
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          processedFiles.push({
            type: 'text',
            text: `[File: ${file.name} - error processing]`
          });
        }
      }

      if (processedFiles.length > 0) {
        const fileDescriptions = processedFiles.map(f => f.text).join('\n');
        messageText = `${text}\n\nFiles:\n${fileDescriptions}`.trim();
      }
    }

    // Add mode context
    if (mode === 'thinking') {
      messageText = `[🧠 Thinking Mode] Please think step by step and show your reasoning process.\n\n${messageText}`;
    } else if (mode === 'search') {
      messageText = `[🔍 Search Mode] Please provide comprehensive, well-researched information.\n\n${messageText}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text, // Store original text without file descriptions for display
      isUser: true,
      timestamp: new Date(),
      model: selectedModel
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingText("");
    
    // Create streaming message
    const streamingId = (Date.now() + 1).toString();
    setStreamingMessageId(streamingId);

    try {
      console.log('Sending message to Puter AI:', messageText);
      console.log('Selected model:', selectedModel);

      // Check Puter availability
      if (typeof (window as any).puter === 'undefined' || typeof (window as any).puter.ai === 'undefined') {
        throw new Error('Puter SDK not available. Please ensure the Puter SDK is loaded.');
      }

      // Prepare context
      const recentMessages = updatedMessages.slice(-5).filter(msg => msg.id !== 'welcome');
      const contextMessages = recentMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      const puterModel = puterService.mapModelName(selectedModel);
      console.log('Using Puter model:', puterModel);

      let systemPrompt = '';
      if (mode === 'thinking') {
        systemPrompt = 'Think step by step and explain your reasoning process clearly. Show your thought process and analysis. ';
      } else if (mode === 'search') {
        systemPrompt = 'Search for relevant information and provide comprehensive, well-researched answers. ';
      }

      let responseText: string;

      if (processedFiles.length > 0) {
        const content = [{
          type: 'text',
          text: systemPrompt + messageText
        }, ...processedFiles];
        responseText = await puterService.chatWithFiles(content, {
          model: puterModel,
          max_tokens: 2000,
          temperature: selectedModel.includes('r1') ? 0.1 : mode === 'thinking' ? 0.3 : 0.7
        }, sessionId);
      } else {
        responseText = await puterService.chat(systemPrompt + messageText, {
          model: puterModel,
          context: contextMessages,
          max_tokens: 1500,
          temperature: selectedModel.includes('r1') ? 0.1 : mode === 'thinking' ? 0.3 : 0.7
        }, sessionId);
      }

      console.log('Puter response received:', responseText);

      // Stream the response
      await streamResponseText(responseText);

      const aiResponse: Message = {
        id: streamingId,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        model: selectedModel
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      saveChat(finalMessages);
      
    } catch (error) {
      console.error('Puter AI Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResponse: Message = {
        id: streamingId,
        text: `I apologize, but I'm unable to process your request at the moment. \n\nError: ${errorMessage}\n\nPlease try again or check if the Puter SDK is properly loaded.`,
        isUser: false,
        timestamp: new Date(),
        model: 'error'
      };

      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      saveChat(finalMessages);

      toast({
        title: "Connection Error",
        description: "Unable to connect to AI service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      setStreamingMessageId(null);
    }
  };

  const streamResponseText = async (text: string) => {
    const words = text.split(' ');
    const chunkSize = Math.max(1, Math.floor(words.length / 30));
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      setStreamingText(prev => prev + chunk);
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 30));
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: "welcome",
      text: "Hello! I'm Cosmic AI, your advanced AI assistant. I can help with coding, writing, analysis, and much more. Choose your preferred model and let's start our conversation! ✨",
      isUser: false,
      timestamp: new Date(),
      model: 'system'
    };
    setMessages([welcomeMessage]);
    setStreamingText("");
    setIsStreaming(false);
    setStreamingMessageId(null);
  };

  const regenerateLastResponse = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.isUser);
    if (lastUserMessage && !isStreaming) {
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].isUser) {
          lastUserIndex = i;
          break;
        }
      }
      const messagesUpToLastUser = messages.slice(0, lastUserIndex + 1);
      setMessages(messagesUpToLastUser);
      await handleSendMessage(lastUserMessage.text, [], 'normal');
    }
  };

  const copyChat = () => {
    const chatText = messages.filter(m => m.id !== 'welcome').map(m => 
      `${m.isUser ? 'You' : `AI (${modelDisplayNames[m.model as Model] || m.model})`}: ${m.text}`
    ).join('\n\n');
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
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `cosmic-ai-chat-${Date.now()}.json`;
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
    const chatText = messages.filter(m => m.id !== 'welcome').map(m => 
      `${m.isUser ? 'You' : 'AI'}: ${m.text}`
    ).join('\n\n');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cosmic AI Chat Conversation',
          text: chatText
        });
      } catch (error) {
        copyChat();
      }
    } else {
      copyChat();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-background/95 backdrop-blur-sm border-b border-border/20 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="font-semibold text-foreground text-sm">Cosmic AI</h1>
              <p className="text-xs text-muted-foreground">Advanced AI Assistant</p>
            </div>
          </div>
          
          <Select value={selectedModel} onValueChange={(value: Model) => setSelectedModel(value)}>
            <SelectTrigger className="w-32 sm:w-48 bg-muted/50 border border-border/50 text-foreground text-xs sm:text-sm rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border border-border z-50 max-h-[400px] overflow-y-auto rounded-xl">
              {Object.entries(modelCategories).map(([category, models]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border/20">
                    {category}
                  </div>
                  {models.map(model => (
                    <SelectItem key={model} value={model} className="hover:bg-accent/50 text-xs sm:text-sm">
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{modelDisplayNames[model as Model]}</span>
                        <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-green-200">
                          Live
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <VoiceSettings>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-9">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </VoiceSettings>
          
          <div className="hidden sm:flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={regenerateLastResponse} 
              disabled={isStreaming || messages.filter(m => m.isUser).length === 0}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyChat}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 h-8 w-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={exportChat}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 h-8 w-8 p-0"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={shareChat}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 h-8 w-8 p-0"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            disabled={isStreaming}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-2">Clear</span>
          </Button>
          
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg border border-border/30 hidden sm:block">
            {messages.filter(m => m.id !== 'welcome').length} msgs
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-3 sm:px-4 md:px-6">
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto py-4 sm:py-6">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message.text} 
              isUser={message.isUser} 
              timestamp={message.timestamp} 
              model={message.model} 
            />
          ))}
          {isStreaming && streamingText && (
            <div className="animate-fade-in">
              <ChatMessage 
                message={streamingText} 
                isUser={false} 
                timestamp={new Date()} 
                model={selectedModel} 
                isStreaming={true} 
              />
            </div>
          )}
          {isTyping && !isStreaming && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 sm:p-4 md:p-6 bg-background/95 backdrop-blur-sm border-t border-border/20">
        <div className="max-w-4xl mx-auto">
          <EnhancedChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
};