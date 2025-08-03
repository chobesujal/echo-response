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
    setIsStreaming(true);
    setStreamingText("");

    try {
      // Prepare context for better responses
      const contextMessages = updatedMessages
        .slice(-6) // Last 6 messages for context
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        }));

      let response;
      
      // Use Puter for DeepSeek and Gemini models with optimized settings
      if (selectedModel.startsWith('deepseek') || selectedModel === 'gemini-2.0-flash') {
        response = await (window as any).puter.ai.chat(text, {
          model: selectedModel,
          context: contextMessages,
          max_tokens: 4000,
          temperature: selectedModel.includes('reasoner') ? 0.3 : 0.7,
          stream: true
        });
      } else {
        // Enhanced simulation for other models
        response = await simulateAdvancedResponse(text, selectedModel, contextMessages);
      }
      
      let responseText = extractResponseText(response);
      
      // Real-time streaming display
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

  const simulateAdvancedResponse = async (prompt: string, model: string, context: any[]): Promise<string> => {
    // Reduced delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    // Analyze prompt for code-related requests
    const isCodeRequest = /code|program|function|class|algorithm|debug|syntax|api|javascript|python|react|html|css/i.test(prompt);
    const isExplanationRequest = /explain|how|what|why|describe|tell me about/i.test(prompt);
    
    if (isCodeRequest) {
      return generateCodeResponse(prompt, model);
    } else if (isExplanationRequest) {
      return generateExplanationResponse(prompt, model);
    } else {
      return generateGeneralResponse(prompt, model, context);
    }
  };

  const generateCodeResponse = (prompt: string, model: string): string => {
    const codeExamples = [
      `Here's a solution using ${modelDisplayNames[model as Model]}:

\`\`\`javascript
// Example implementation
function sampleFunction() {
  const result = processData();
  return result.map(item => ({
    ...item,
    processed: true
  }));
}

// Usage
const data = sampleFunction();
console.log(data);
\`\`\`

This approach provides:
• Clean, readable code structure
• Error handling capabilities
• Optimized performance
• Easy maintenance

Would you like me to explain any specific part or add more features?`,

      `Based on your request, here's an advanced implementation:

\`\`\`typescript
interface DataStructure {
  id: string;
  value: any;
  metadata?: object;
}

class AdvancedProcessor {
  private cache = new Map();
  
  async process(data: DataStructure[]): Promise<DataStructure[]> {
    return data.map(item => this.processItem(item));
  }
  
  private processItem(item: DataStructure): DataStructure {
    // Advanced processing logic
    return {
      ...item,
      processed: true,
      timestamp: Date.now()
    };
  }
}
\`\`\`

Key features:
• TypeScript support for better type safety
• Caching mechanism for performance
• Modular design for scalability
• Async/await for non-blocking operations`
    ];
    
    return codeExamples[Math.floor(Math.random() * codeExamples.length)];
  };

  const generateExplanationResponse = (prompt: string, model: string): string => {
    const explanations = [
      `Let me break this down for you using ${modelDisplayNames[model as Model]}'s analytical capabilities:

## Key Concepts

1. **Core Principle**: The fundamental idea revolves around structured data processing
2. **Implementation Strategy**: 
   - Start with data validation
   - Apply transformation rules
   - Optimize for performance
3. **Best Practices**:
   - Use consistent naming conventions
   - Implement proper error handling
   - Document your code thoroughly

## Practical Example

Consider this real-world scenario where you need to handle user data efficiently while maintaining security and performance standards.

Would you like me to dive deeper into any specific aspect?`,

      `Excellent question! Here's a comprehensive explanation:

### Understanding the Context
${prompt.slice(0, 100)}...

### Detailed Analysis
1. **Primary Considerations**: 
   - Scalability requirements
   - Performance implications
   - Security measures

2. **Implementation Approach**:
   - Modular architecture
   - Clean code principles  
   - Test-driven development

3. **Advanced Techniques**:
   - Caching strategies
   - Optimization patterns
   - Error recovery mechanisms

### Next Steps
I recommend starting with a basic implementation and gradually adding complexity as needed.`
    ];
    
    return explanations[Math.floor(Math.random() * explanations.length)];
  };

  const generateGeneralResponse = (prompt: string, model: string, context: any[]): string => {
    const responses = [
      `Thank you for your question! As ${modelDisplayNames[model as Model]}, I can help you with:

**For your specific request**: "${prompt.slice(0, 60)}..."

I understand you're looking for assistance with this topic. While I'm currently in demonstration mode for this model, I can provide general guidance and suggestions.

**Key points to consider**:
• Context analysis and understanding
• Step-by-step approach to problem-solving
• Best practices and recommendations
• Resource optimization

**Next steps**:
1. Clarify specific requirements
2. Identify potential challenges
3. Develop implementation strategy
4. Test and iterate

Is there a particular aspect you'd like me to focus on?`,

      `I appreciate your question about "${prompt.slice(0, 50)}..."

Based on the context from our conversation, I can see you're working on something important. Let me provide some insights:

**Analysis**:
- Your request involves multiple considerations
- There are several approaches we could take
- Each has its own advantages and trade-offs

**Recommendations**:
1. Start with a clear problem definition
2. Break down into manageable components
3. Consider scalability from the beginning
4. Plan for future enhancements

**Available Resources**:
• Documentation and guides
• Community best practices
• Code examples and templates
• Performance optimization tips

How would you like to proceed with this?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
