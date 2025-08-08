import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { EnhancedChatInput } from "./EnhancedChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Copy, Download, Share, Sparkles, Settings } from "lucide-react";
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
export const EnhancedChatContainer = ({
  currentChatId,
  onChatUpdate
}: EnhancedChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    text: "Hello! I'm Cosmic AI, your advanced AI assistant. I can help with coding, writing, analysis, and much more. Choose your preferred model and let's start our cosmic conversation! ✨",
    isUser: false,
    timestamp: new Date(),
    model: 'system'
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>('deepseek-reasoner');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
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
  const handleSendMessage = async (text: string, files?: File[], mode?: 'thinking' | 'search' | 'normal') => {
    let messageText = text;
    let processedFiles: any[] = [];

    // Handle file uploads with Puter AI integration
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          if (file.type.startsWith('image/')) {
            // Convert image to base64 for Puter AI
            const imageUrl = URL.createObjectURL(file);
            const imageDescription = await puterService.imageToText(imageUrl, `Describe this image in detail: ${file.name}`);
            processedFiles.push({
              type: 'text',
              text: `[Image: ${file.name}] ${imageDescription}`
            });
            URL.revokeObjectURL(imageUrl);
          } else {
            // For other files, create file reference for Puter
            processedFiles.push({
              type: 'file',
              puter_path: `~/uploads/${file.name}`,
              // Simulated path
              text: `Please analyze this ${file.type} file: ${file.name}`
            });
          }
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          processedFiles.push({
            type: 'text',
            text: `[File: ${file.name} - Error processing file]`
          });
        }
      }

      // Add file descriptions to message
      const fileDescriptions = processedFiles.map(f => f.text || `[File: ${f.puter_path}]`).join('\n');
      messageText = `${text}\n\nFiles:\n${fileDescriptions}`.trim();
    }

    // Add mode context to message
    if (mode === 'thinking') {
      messageText = `[🧠 Thinking Mode] ${messageText}`;
    } else if (mode === 'search') {
      messageText = `[🔍 Search Mode] ${messageText}`;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      model: selectedModel
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingText("");
    try {
      // Check if Puter is available
      if (typeof (window as any).puter === 'undefined' || typeof (window as any).puter.ai === 'undefined') {
        throw new Error('Puter SDK not available');
      }
      console.log('Sending message to Puter:', messageText);

      // Prepare context messages for better responses
      const recentMessages = updatedMessages.slice(-5).filter(msg => msg.id !== 'welcome');
      const contextMessages = recentMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      // Map our model names to Puter-compatible models
      const puterModel = puterService.mapModelName(selectedModel);

      // Adjust prompt based on mode
      let systemPrompt = '';
      if (mode === 'thinking') {
        systemPrompt = 'Think step by step and explain your reasoning process clearly. Show your thought process and analysis. ';
      } else if (mode === 'search') {
        systemPrompt = 'Search for relevant information and provide comprehensive, well-researched answers with sources when possible. ';
      }
      let responseText: string;

      // Use appropriate method based on whether files are involved
      if (processedFiles.length > 0) {
        const content = [{
          type: 'text',
          text: systemPrompt + text
        }, ...processedFiles];
        responseText = await puterService.chatWithFiles(content, {
          model: puterModel,
          max_tokens: 1500,
          temperature: selectedModel.includes('reasoner') ? 0.1 : mode === 'thinking' ? 0.3 : 0.7
        });
      } else {
        responseText = await puterService.chat(systemPrompt + messageText, {
          model: puterModel,
          context: contextMessages,
          max_tokens: 1000,
          temperature: selectedModel.includes('reasoner') ? 0.1 : mode === 'thinking' ? 0.3 : 0.7
        });
      }
      console.log('Puter response received:', responseText);

      // Simulate streaming for better UX
      await streamResponseRealTime(responseText);
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
      setIsStreaming(false);
      setStreamingText("");
    } catch (error) {
      console.error('Puter AI Error:', error);
      setIsStreaming(false);
      setStreamingText("");
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm unable to connect to the AI service at the moment. Please ensure the Puter SDK is properly loaded and try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTo use this app, you need to include the Puter SDK in your HTML.`,
        isUser: false,
        timestamp: new Date(),
        model: selectedModel
      };
      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      saveChat(finalMessages);
      toast({
        title: "Connection Error",
        description: "Unable to connect to Puter AI service. Please try again.",
        variant: "destructive"
      });
    }
  };
  const streamResponseRealTime = async (text: string) => {
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
      setStreamingText(chars.slice(0, i + 1).join(''));
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 40));
    }
  };
  const clearChat = () => {
    const welcomeMessage = {
      id: "welcome",
      text: "Hello! I'm Cosmic AI, your advanced AI assistant. I can help with coding, writing, analysis, and much more. Choose your preferred model and let's start our cosmic conversation! ✨",
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
      await handleSendMessage(lastUserMessage.text, [], 'normal');
    }
  };
  const copyChat = () => {
    const chatText = messages.filter(m => m.id !== 'welcome').map(m => `${m.isUser ? 'You' : `AI (${m.model})`}: ${m.text}`).join('\n\n');
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
    const chatText = messages.filter(m => m.id !== 'welcome').map(m => `${m.isUser ? 'You' : 'AI'}: ${m.text}`).join('\n\n');
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
  return <div className="flex flex-col h-full bg-gradient-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-xs">@sujalchobe</h1>
              <p className="text-xs text-muted-foreground">Advanced AI Assistant</p>
            </div>
          </div>
          <Select value={selectedModel} onValueChange={(value: Model) => setSelectedModel(value)}>
            <SelectTrigger className="w-56 bg-background/50 backdrop-blur-sm border border-border/30 text-foreground shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border border-border/50">
              {Object.entries(modelCategories).map(([category, models]) => <div key={category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {models.map(model => <SelectItem key={model} value={model} className="hover:bg-accent/50">
                      <div className="flex items-center justify-between w-full">
                        <span>{modelDisplayNames[model as Model]}</span>
                        {(model === 'deepseek-reasoner' || model === 'deepseek-chat' || model === 'gemini-2.0-flash') && <Badge variant="secondary" className="ml-2 text-xs bg-primary/20 text-primary border-primary/30">Live</Badge>}
                      </div>
                    </SelectItem>)}
                </div>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <VoiceSettings>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-all duration-200">
              <Settings className="w-4 h-4" />
            </Button>
          </VoiceSettings>
          <Button variant="ghost" size="sm" onClick={regenerateLastResponse} disabled={isStreaming || messages.filter(m => m.isUser).length === 0} className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-all duration-200">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyChat} className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-all duration-200">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={exportChat} className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-all duration-200">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={shareChat} className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-all duration-200">
            <Share className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-all duration-200">
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="text-sm text-muted-foreground bg-background/30 px-3 py-1 rounded-xl border border-border/30">
            {messages.filter(m => m.id !== 'welcome').length} messages
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map(message => <ChatMessage key={message.id} message={message.text} isUser={message.isUser} timestamp={message.timestamp} model={message.model} />)}
          {isTyping && !isStreaming && <TypingIndicator />}
          {isStreaming && streamingText && <div className="animate-fade-in">
              <ChatMessage message={streamingText} isUser={false} timestamp={new Date()} model={selectedModel} isStreaming={true} />
            </div>}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 bg-background/30 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <EnhancedChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>;
};