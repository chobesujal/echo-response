import { useState, KeyboardEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@11labs/react";
import { 
  Plus, 
  Brain, 
  Search, 
  Mic, 
  MicOff, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  ChevronDown,
  Volume2,
  VolumeX,
  Send
} from "lucide-react";

interface EnhancedChatInputProps {
  onSendMessage: (message: string, files?: File[], mode?: 'thinking' | 'search' | 'normal') => void;
  disabled?: boolean;
}

export const EnhancedChatInput = ({ onSendMessage, disabled }: EnhancedChatInputProps) => {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<'thinking' | 'search' | 'normal'>('normal');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(localStorage.getItem('elevenlabs-api-key') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // ElevenLabs conversation setup
  const conversation = useConversation({
    onConnect: () => {
      toast({
        title: "Voice Connected",
        description: "Voice chat is now active"
      });
    },
    onDisconnect: () => {
      setIsListening(false);
      toast({
        title: "Voice Disconnected",
        description: "Voice chat ended"
      });
    },
    onMessage: (message) => {
      if (message.message && message.message.trim()) {
        onSendMessage(message.message, [], 'normal');
      }
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      toast({
        title: "Voice Error",
        description: "Voice chat encountered an error",
        variant: "destructive"
      });
      setIsListening(false);
    }
  });

  const handleSend = () => {
    if ((message.trim() || attachedFiles.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachedFiles, mode);
      setMessage("");
      setAttachedFiles([]);
      setMode('normal');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Allow images, text files, PDFs, docs
      const validTypes = ['image/', 'text/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
      return validTypes.some(type => file.type.startsWith(type)) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were skipped. Only images, text files, and documents under 10MB are allowed.",
        variant: "destructive"
      });
    }

    setAttachedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceToggle = async () => {
    if (!elevenLabsApiKey) {
      const apiKey = prompt("Please enter your ElevenLabs API key:");
      if (!apiKey) return;
      
      setElevenLabsApiKey(apiKey);
      localStorage.setItem('elevenlabs-api-key', apiKey);
    }

    try {
      if (!isListening) {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Start voice conversation
        const agentId = "your-agent-id"; // Replace with actual agent ID
        await conversation.startSession({ 
          agentId,
          // You would need to implement signed URL generation for production
        });
        setIsListening(true);
      } else {
        await conversation.endSession();
        setIsListening(false);
      }
    } catch (error) {
      toast({
        title: "Voice Chat Error",
        description: "Failed to start voice chat. Please check your microphone permissions and API key.",
        variant: "destructive"
      });
      console.error('Voice chat error:', error);
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'thinking':
        return <Brain className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'search':
        return <Search className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Brain className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'thinking':
        return 'Thinking';
      case 'search':
        return 'Search';
      default:
        return 'Normal';
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="relative">
      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 sm:p-3 bg-gradient-secondary rounded-t-2xl border border-border/50 mb-0">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-xs sm:text-sm border border-border/30 shadow-message">
              {file.type.startsWith('image/') ? 
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" /> : 
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              }
              <span className="truncate max-w-24 sm:max-w-32 text-foreground">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1 flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Container */}
      <div className={`flex items-end gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-secondary backdrop-blur-xl border border-border/50 shadow-elegant ${attachedFiles.length > 0 ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
        {/* Add Files Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-background/50 hover:bg-background/80 border border-border/30 shadow-sm transition-all duration-200 hover:shadow-message p-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover text-popover-foreground border border-border z-50">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="hover:bg-accent/50">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            className="min-h-[44px] max-h-[120px] resize-none pr-20 sm:pr-32 bg-background/50 border border-border/30 rounded-xl backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base"
            disabled={disabled || isListening}
            rows={1}
          />
          
          {/* Mode Selector & Voice Button */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 sm:h-8 px-2 sm:px-3 rounded-lg bg-background/50 hover:bg-background/80 border border-border/30 text-xs font-medium transition-all duration-200"
                >
                  {getModeIcon()}
                  <span className="ml-1 hidden sm:inline">{getModeLabel()}</span>
                  <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover text-popover-foreground border border-border z-50">
                <DropdownMenuItem onClick={() => setMode('normal')} className="hover:bg-accent/50">
                  <Brain className="w-4 h-4 mr-2" />
                  Normal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('thinking')} className="hover:bg-accent/50">
                  <Brain className="w-4 h-4 mr-2" />
                  Thinking
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('search')} className="hover:bg-accent/50">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice Chat Button */}
            <Button 
              variant={isListening ? "default" : "ghost"}
              size="sm" 
              className={`shrink-0 w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-lg transition-all duration-300 ${
                isListening 
                  ? 'bg-gradient-primary text-primary-foreground shadow-glow animate-pulse-glow' 
                  : 'bg-background/50 hover:bg-background/80 border border-border/30'
              }`}
              onClick={handleVoiceToggle}
              disabled={disabled}
            >
              {isListening ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSend} 
          disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
          size="sm"
          className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        className="hidden"
      />

      {/* Voice Status */}
      {isListening && (
        <div className="absolute -top-12 sm:-top-16 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground px-3 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium shadow-glow animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
            Listening... Speak now or click to stop
          </div>
        </div>
      )}
    </div>
  );
};