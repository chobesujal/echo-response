import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { EnhancedChatInput } from "./EnhancedChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { SandboxEnvironment } from "./SandboxEnvironment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Plus, ChevronDown, Sparkles, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { puterService } from "@/lib/puterService";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  model?: string;
  hasCode?: boolean;
  codeLanguage?: string;
  codeContent?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  messageCount: number;
}

type Model = 
  | 'deepseek-v3'
  | 'deepseek-r1'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt-3.5-turbo'
  | 'o1-preview'
  | 'o1-mini'
  | 'chatgpt-4o-latest'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash-exp'
  | 'llama-3.1-405b'
  | 'llama-3.1-70b'
  | 'llama-3.1-8b'
  | 'mistral-large'
  | 'mixtral-8x7b'
  | 'codellama-34b';

const modelDisplayNames: Record<Model, string> = {
  'deepseek-v3': 'DeepSeek V3',
  'deepseek-r1': 'DeepSeek R1',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'o1-preview': 'o1-preview',
  'o1-mini': 'o1-mini',
  'chatgpt-4o-latest': 'ChatGPT-4o',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'llama-3.1-405b': 'Llama 3.1 405B',
  'llama-3.1-70b': 'Llama 3.1 70B',
  'llama-3.1-8b': 'Llama 3.1 8B',
  'mistral-large': 'Mistral Large',
  'mixtral-8x7b': 'Mixtral 8x7B',
  'codellama-34b': 'CodeLlama 34B'
};

// Fixed model categories with Claude second as requested
const modelCategories = {
  'DeepSeek': ['deepseek-v3', 'deepseek-r1'],
  'Anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  'OpenAI': ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini', 'chatgpt-4o-latest'],
  'Google': ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
  'Meta': ['llama-3.1-405b', 'llama-3.1-70b', 'llama-3.1-8b'],
  'Other': ['mistral-large', 'mixtral-8x7b', 'codellama-34b']
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
    text: "Hello! I'm Cosmic AI, your advanced AI assistant with access to multiple cutting-edge AI models.\n\nWhat I can help you with:\n• Coding & Development - Write, debug, and explain code in 50+ languages\n• Creative Writing - Stories, articles, scripts, and more\n• Analysis & Research - Data analysis, research, and insights\n• Problem Solving - Step-by-step solutions and explanations\n• Image Analysis - Describe and analyze uploaded images\n• File Processing - Work with documents, code files, and more\n\nChoose your preferred AI model from the Reasoning model dropdown and let's start our conversation!",
    isUser: false,
    timestamp: new Date(),
    model: 'system'
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>('deepseek-v3');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => currentChatId || `session-${Date.now()}`);
  const [streamingText, setStreamingText] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<Record<string, 'working' | 'testing' | 'error'>>({});
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxLanguage, setSandboxLanguage] = useState('javascript');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Puter service and test models on component mount
  useEffect(() => {
    const initializePuter = async () => {
      try {
        console.log('Initializing Puter service...');
        const initialized = await puterService.initialize();
        if (initialized) {
          console.log('Puter service initialized successfully');
          toast({
            title: "AI Service Ready",
            description: "All AI models are now available for use."
          });
          
          // Test all models
          const models = puterService.getAvailableModels();
          for (const model of models) {
            try {
              setModelStatus(prev => ({ ...prev, [model]: 'testing' }));
              const isWorking = await puterService.testModel(model);
              setModelStatus(prev => ({ ...prev, [model]: isWorking ? 'working' : 'error' }));
            } catch (error) {
              setModelStatus(prev => ({ ...prev, [model]: 'error' }));
            }
          }
        } else {
          console.error('Failed to initialize Puter service');
          toast({
            title: "Connection Issue",
            description: "AI service initialization failed. Some features may not work.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to initialize Puter service:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to connect to AI services. Please refresh the page.",
          variant: "destructive"
        });
      }
    };
    initializePuter();
  }, [toast]);

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
          setShowSuggestions(messagesWithDates.length <= 1);
          setSessionId(chatId);
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
        id: sessionId,
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

  const detectCodeInMessage = (text: string): { hasCode: boolean; language?: string; code?: string } => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    
    if (match) {
      return {
        hasCode: true,
        language: match[1] || 'text',
        code: match[2]
      };
    }
    
    return { hasCode: false };
  };

  const handleSendMessage = async (text: string, files?: File[], mode?: 'thinking' | 'search' | 'normal') => {
    if (!text.trim() && (!files || files.length === 0)) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

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
              const imageDescription = await puterService.imageToText(imageUrl, `Describe this image in detail: ${file.name}`, sessionId);
              processedFiles.push({
                type: 'text',
                text: `[Image: ${file.name}] ${imageDescription}`
              });
            } catch (error) {
              processedFiles.push({
                type: 'text',
                text: `[Image: ${file.name}] - Unable to process image: ${error}`
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

    // Detect code in user message
    const codeDetection = detectCodeInMessage(text);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
      model: selectedModel,
      hasCode: codeDetection.hasCode,
      codeLanguage: codeDetection.language,
      codeContent: codeDetection.code
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingText("");
    
    // Create streaming message
    const streamingId = (Date.now() + 1).toString();
    setStreamingMessageId(streamingId);

    try {
      console.log('Sending message to Puter AI:', messageText.slice(0, 100));
      console.log('Selected model:', selectedModel);
      console.log('Session ID:', sessionId);
      
      // Check Puter availability
      if (!await puterService.isAvailable()) {
        throw new Error('Puter SDK not available. Please ensure the Puter SDK is loaded.');
      }

      let responseText: string;

      if (processedFiles.length > 0) {
        const content = [{
          type: 'text',
          text: messageText
        }, ...processedFiles];
        responseText = await puterService.chatWithFiles(content, {
          model: selectedModel,
          max_tokens: 2000,
          temperature: selectedModel.includes('r1') ? 0.1 : mode === 'thinking' ? 0.3 : 0.7,
          memory: true
        }, sessionId);
      } else {
        responseText = await puterService.chat(messageText, {
          model: selectedModel,
          max_tokens: 1500,
          temperature: selectedModel.includes('r1') ? 0.1 : mode === 'thinking' ? 0.3 : 0.7,
          memory: true
        }, sessionId);
      }

      console.log('Puter response received:', responseText.slice(0, 100));

      // Update model status
      setModelStatus(prev => ({ ...prev, [selectedModel]: 'working' }));

      // Stream the response
      await streamResponseText(responseText);

      // Detect code in AI response
      const aiCodeDetection = detectCodeInMessage(responseText);

      const aiResponse: Message = {
        id: streamingId,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        model: selectedModel,
        hasCode: aiCodeDetection.hasCode,
        codeLanguage: aiCodeDetection.language,
        codeContent: aiCodeDetection.code
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      saveChat(finalMessages);

      // Auto-open sandbox for code responses
      if (aiCodeDetection.hasCode && aiCodeDetection.code && aiCodeDetection.language) {
        const webLanguages = ['html', 'css', 'javascript', 'jsx', 'tsx', 'vue', 'svelte'];
        if (webLanguages.includes(aiCodeDetection.language)) {
          setSandboxCode(aiCodeDetection.code);
          setSandboxLanguage(aiCodeDetection.language);
          setShowSandbox(true);
        }
      }
      
    } catch (error) {
      console.error('Puter AI Error:', error);
      
      // Update model status
      setModelStatus(prev => ({ ...prev, [selectedModel]: 'error' }));
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      let errorResponse: Message = {
        id: streamingId,
        text: `I apologize, but I'm unable to process your request at the moment. \n\nError: ${errorMessage}\n\nPossible solutions:\n1. Try refreshing the page\n2. Switch to a different model (DeepSeek V3 recommended)\n3. Check your internet connection\n4. Try again in a moment\n\nPlease try again or contact support if the issue persists.`,
        isUser: false,
        timestamp: new Date(),
        model: 'error'
      };

      // Provide better error messages for specific issues
      if (errorMessage.includes('model')) {
        errorResponse.text = `The selected model "${modelDisplayNames[selectedModel]}" is currently unavailable. Please try:\n\nRecommended alternatives:\n1. DeepSeek V3 (most reliable)\n2. GPT-4o Mini (fast and efficient)\n3. Claude 3.5 Sonnet (excellent reasoning)\n\nError details: ${errorMessage}`;
      } else if (errorMessage.includes('SDK')) {
        errorResponse.text = `Connection issue detected. Please:\n\n1. Refresh the page to reload the AI service\n2. Check your internet connection\n3. Try again in a moment\n\nThe Puter SDK may need to reload to restore full functionality.`;
      }

      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      saveChat(finalMessages);

      toast({
        title: "AI Response Error",
        description: `Failed to get response from ${modelDisplayNames[selectedModel]}. Try a different model.`,
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      setStreamingMessageId(null);
    }
  };

  // Enhanced streaming with better performance
  const streamResponseText = async (text: string) => {
    const words = text.split(' ');
    const chunkSize = Math.max(1, Math.floor(words.length / 50));
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      setStreamingText(prev => prev + chunk);
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 10));
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: "welcome",
      text: "Hello! I'm Cosmic AI, your advanced AI assistant with access to multiple cutting-edge AI models.\n\nWhat I can help you with:\n• Coding & Development - Write, debug, and explain code in 50+ languages\n• Creative Writing - Stories, articles, scripts, and more\n• Analysis & Research - Data analysis, research, and insights\n• Problem Solving - Step-by-step solutions and explanations\n• Image Analysis - Describe and analyze uploaded images\n• File Processing - Work with documents, code files, and more\n\nChoose your preferred AI model from the Reasoning model dropdown and let's start our conversation!",
      isUser: false,
      timestamp: new Date(),
      model: 'system'
    };
    setMessages([welcomeMessage]);
    setStreamingText("");
    setIsStreaming(false);
    setStreamingMessageId(null);
    setShowSuggestions(true);
    setShowSandbox(false);
    
    // Clear memory for current session and model
    puterService.clearMemory(sessionId, selectedModel);
  };

  const regenerateResponse = async (messageId: string) => {
    if (isStreaming || regeneratingMessageId) return;
    
    setRegeneratingMessageId(messageId);
    
    // Find the message to regenerate and the user message before it
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Find the last user message before this AI message
    let lastUserMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].isUser) {
        lastUserMessage = messages[i];
        break;
      }
    }
    
    if (!lastUserMessage) return;
    
    // Remove all messages after the user message
    const messagesUpToUser = messages.slice(0, messageIndex);
    setMessages(messagesUpToUser);
    
    try {
      // Regenerate the response
      await handleSendMessage(lastUserMessage.text, [], 'normal');
    } catch (error) {
      console.error('Error regenerating response:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingMessageId(null);
    }
  };

  const handleNewConversation = () => {
    // Generate new session ID
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    
    // Clear current chat
    clearChat();
    
    // Clear memory for new session
    puterService.clearMemory(newSessionId);
    
    toast({
      title: "New Conversation",
      description: "Started a fresh conversation with clean memory."
    });
  };

  const getModelStatusBadge = (model: string) => {
    const status = modelStatus[model];
    if (status === 'working') {
      return <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-green-200">Live</Badge>;
    } else if (status === 'error') {
      return <Badge variant="secondary" className="ml-2 text-xs bg-red-100 text-red-700 border-red-200">Error</Badge>;
    } else if (status === 'testing') {
      return <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-700 border-yellow-200">Testing</Badge>;
    }
    return <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 border-blue-200">Ready</Badge>;
  };

  const suggestionPrompts = [
    "Write a React component for a todo list",
    "Create a Python script for data analysis", 
    "Build a responsive landing page with HTML/CSS",
    "Explain how machine learning works",
    "Help me debug this JavaScript code",
    "Write a Vue.js component with animations"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, [], 'normal');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed Header - Single New Conversation Button */}
      <div className="flex items-center justify-between p-4 bg-background border-b border-border/20">
        <div className="flex items-center gap-4">
          {/* Single New Conversation Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNewConversation}
            className="gap-2 bg-background hover:bg-muted/50 border border-border/30 rounded-lg px-3 py-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
          
          {/* Reasoning model section */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Reasoning model</span>
            <Select value={selectedModel} onValueChange={(value: Model) => setSelectedModel(value)}>
              <SelectTrigger className="w-56 bg-background border border-border text-foreground text-sm rounded-lg hover:bg-muted/50 transition-colors">
                <SelectValue />
                <ChevronDown className="w-4 h-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border border-border z-50 max-h-[400px] overflow-y-auto rounded-lg shadow-xl">
                {Object.entries(modelCategories).map(([category, models]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/20 bg-muted/30 sticky top-0">
                      {category}
                    </div>
                    {models.map(model => (
                      <SelectItem key={model} value={model} className="hover:bg-accent/50 text-sm py-3">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{modelDisplayNames[model as Model]}</span>
                          {getModelStatusBadge(model)}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            disabled={isStreaming}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30">
            {messages.filter(m => m.id !== 'welcome').length} messages
          </div>
        </div>
      </div>
      
      {/* Main Content Area with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={showSandbox ? 50 : 100} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Chat Area */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 md:px-6">
                <div className="space-y-6 max-w-4xl mx-auto py-6">
                  {messages.map(message => (
                    <div key={message.id}>
                      <ChatMessage 
                        message={message.text} 
                        isUser={message.isUser} 
                        timestamp={message.timestamp} 
                        model={message.model} 
                      />
                      {/* Regenerate button for AI messages */}
                      {!message.isUser && message.id !== 'welcome' && (
                        <div className="flex justify-start mt-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateResponse(message.id)}
                            disabled={isStreaming || regeneratingMessageId === message.id}
                            className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {regeneratingMessageId === message.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            {regeneratingMessageId === message.id ? 'Regenerating...' : 'Regenerate response'}
                          </Button>
                        </div>
                      )}
                      {message.hasCode && message.codeContent && (
                        <div className="mt-4 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSandboxCode(message.codeContent!);
                              setSandboxLanguage(message.codeLanguage!);
                              setShowSandbox(true);
                            }}
                            className="gap-2"
                          >
                            <Code2 className="w-4 h-4" />
                            Open in Sandbox
                          </Button>
                        </div>
                      )}
                    </div>
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
                  
                  {/* Suggestion prompts for new chats */}
                  {showSuggestions && messages.length === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                      {suggestionPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="p-4 h-auto text-left justify-start hover:bg-muted/50 border-border/30"
                          onClick={() => handleSuggestionClick(prompt)}
                        >
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                            <span className="text-sm">{prompt}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-background border-t border-border/20">
                <div className="max-w-4xl mx-auto">
                  <EnhancedChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Sandbox Panel */}
          {showSandbox && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full border-l border-border/20">
                  <SandboxEnvironment 
                    initialCode={sandboxCode} 
                    initialLanguage={sandboxLanguage}
                    isEmbedded={true}
                    onClose={() => setShowSandbox(false)}
                    className="h-full border-0 rounded-none"
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};