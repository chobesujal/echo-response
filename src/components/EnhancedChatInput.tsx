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
  Send,
  Paperclip,
  X,
  Palette
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
      const validTypes = [
        'image/', 'text/', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument',
        'application/json', 'application/javascript'
      ];
      const validExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.html', '.css', '.scss', '.sass', '.vue', '.svelte', '.md', '.yml', '.yaml', '.xml', '.sql', '.sh', '.ps1'];
      
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      return (isValidType || isValidExtension) && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were skipped. Only supported file types under 10MB are allowed.",
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
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const agentId = localStorage.getItem('elevenlabs-agent-id') || 'default-agent';
        await conversation.startSession({ agentId });
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />;
    }
    return <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />;
  };

  return (
    <div className="relative">
      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-t-2xl border border-border/30 mb-0">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-xl text-xs sm:text-sm border border-border/30 shadow-sm">
              {getFileIcon(file)}
              <span className="truncate max-w-32 sm:max-w-40 text-foreground font-medium">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1 flex-shrink-0 hover:bg-muted/50 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Container */}
      <div className={`flex items-end gap-2 p-2 bg-[#020105]/50 border border-[#FFFAFA]/20 shadow-lg backdrop-blur-sm ${attachedFiles.length > 0 ? 'rounded-b-xl border-t-0' : 'rounded-xl'}`}>
        {/* Attach Files Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-8 h-8 rounded-full bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 border border-[#FFFAFA]/30 transition-all duration-200 p-0"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4 text-[#FFFAFA]/70" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening... Speak now" : "Send a message..."}
            className="min-h-[40px] max-h-[100px] resize-none pr-20 bg-transparent border-0 rounded-xl text-[#FFFAFA] placeholder:text-[#FFFAFA]/50 focus:ring-0 focus:outline-none transition-all duration-200 text-sm"
            disabled={disabled || isListening}
            rows={1}
          />
          
          {/* Mode Selector & Voice Button */}
          <div className="absolute right-1 bottom-1 flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 rounded-full bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 text-xs font-medium transition-all duration-200 text-[#FFFAFA]"
                  disabled={disabled}
                >
                  {getModeIcon()}
                  <ChevronDown className="w-3 h-3 ml-1 text-[#FFFAFA]/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#020105]/95 text-[#FFFAFA] border border-[#FFFAFA]/30 z-50 rounded-xl backdrop-blur-md">
                <DropdownMenuItem onClick={() => setMode('normal')} className="hover:bg-[#FFFAFA]/10 text-[#FFFAFA]">
                  <Brain className="w-4 h-4 mr-2 text-blue-400" />
                  Normal Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('thinking')} className="hover:bg-[#FFFAFA]/10 text-[#FFFAFA]">
                  <Brain className="w-4 h-4 mr-2 text-purple-400" />
                  Thinking Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('search')} className="hover:bg-[#FFFAFA]/10 text-[#FFFAFA]">
                  <Search className="w-4 h-4 mr-2 text-green-400" />
                  Search Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  window.open('/dalle', '_blank');
                }} className="hover:bg-[#FFFAFA]/10 text-[#FFFAFA]">
                  <Palette className="w-4 h-4 mr-2 text-pink-400" />
                  Generate Images
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setMessage("Create a detailed explanation of ");
                  textareaRef.current?.focus();
                }} className="hover:bg-[#FFFAFA]/10 text-[#FFFAFA]">
                  <Brain className="w-4 h-4 mr-2 text-orange-400" />
                  Detailed Explanation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice Chat Button */}
            <Button 
              variant={isListening ? "default" : "ghost"}
              size="sm" 
              className={`shrink-0 w-6 h-6 p-0 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-blue-600 text-white animate-pulse shadow-lg border border-blue-400' 
                  : 'bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 border border-[#FFFAFA]/30'
              }`}
              onClick={handleVoiceToggle}
              disabled={disabled}
            >
              {isListening ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#FFFAFA]/70" />}
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSend} 
          disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
          size="sm"
          className="shrink-0 w-10 h-10 p-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:bg-[#FFFAFA]/20 disabled:text-[#FFFAFA]/40 transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-400/30 hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.html,.css,.scss,.sass,.vue,.svelte,.yml,.yaml,.xml,.json,.sql,.sh,.ps1"
        className="hidden"
      />

      {/* Voice Status */}
      {isListening && (
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg animate-fade-in border border-blue-400/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Listening... Speak now or click to stop
          </div>
        </div>
      )}
    </div>
  );
};