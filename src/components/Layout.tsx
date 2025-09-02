import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { EnhancedChatContainer } from "./EnhancedChatContainer";
import { SettingsDialog } from "./SettingsDialog";
import { Button } from "@/components/ui/button";
import { Settings, Sparkles, Cpu, Zap, Brain, Eye, Code, Calculator, Rocket } from "lucide-react";
import { puterService } from "@/lib/puterService";

export function Layout() {
  const [currentChatId, setCurrentChatId] = useState<string>();
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [darkMode, setDarkMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelCategories, setModelCategories] = useState<Record<string, Array<{ id: string; name: string; provider: string; status: string; category: string }>>>({});

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
    
    // Initialize Puter service and load models
    initializePuterService();
  }, []);

  const initializePuterService = async () => {
    try {
      await puterService.initialize();
      const categories = puterService.getModelsByCategory();
      setModelCategories(categories);
      console.log('Puter service initialized with models:', categories);
    } catch (error) {
      console.error('Failed to initialize Puter service:', error);
    }
  };

  // FIXED: New Chat Handler - Creates proper unique ID and triggers chat container update
  const handleNewChat = () => {
    const newChatId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Layout: Creating new chat with ID:', newChatId);
    setCurrentChatId(newChatId);
    
    // Clear any existing chat state
    localStorage.removeItem(`chat-messages-${currentChatId}`);
    
    // Trigger a page refresh for the chat container to reset
    window.dispatchEvent(new CustomEvent('newChatCreated', { detail: { chatId: newChatId } }));
  };

  const handleLoadChat = (chatId: string) => {
    console.log('Layout: Loading chat with ID:', chatId);
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    try {
      // Remove from chat sessions
      const savedChats = localStorage.getItem('chat-sessions');
      if (savedChats) {
        const sessions = JSON.parse(savedChats);
        const filteredSessions = sessions.filter((s: any) => s.id !== chatId);
        localStorage.setItem('chat-sessions', JSON.stringify(filteredSessions));
      }

      // Remove from chat history
      const savedHistory = localStorage.getItem('chat-history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const filteredHistory = history.filter((h: any) => h.id !== chatId);
        localStorage.setItem('chat-history', JSON.stringify(filteredHistory));
      }

      // Remove chat messages
      localStorage.removeItem(`chat-messages-${chatId}`);

      // If current chat is being deleted, start a new chat
      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleChatUpdate = (chatId: string, title: string, messageCount: number) => {
    console.log('Chat updated:', { chatId, title, messageCount });
  };

  // Enhanced Models Menu Component with all Puter models
  const ModelsMenu = ({ selectedModel, onModelChange }: { selectedModel: string; onModelChange: (model: string) => void }) => {
    const getCategoryIcon = (category: string) => {
      switch (category) {
        case 'Featured': return <Sparkles className="w-3 h-3 text-yellow-400" />;
        case 'Reasoning': return <Brain className="w-3 h-3 text-purple-400" />;
        case 'Code': return <Code className="w-3 h-3 text-blue-400" />;
        case 'Math': return <Calculator className="w-3 h-3 text-green-400" />;
        case 'Vision': return <Eye className="w-3 h-3 text-pink-400" />;
        case 'Large': return <Rocket className="w-3 h-3 text-red-400" />;
        case 'Fast': return <Zap className="w-3 h-3 text-orange-400" />;
        default: return <Cpu className="w-3 h-3 text-gray-400" />;
      }
    };

    const getModelBadgeColor = (status: string) => {
      switch (status) {
        case 'live': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'beta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
    };

    return (
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full bg-[#020105]/80 border-[#FFFAFA]/30 text-[#FFFAFA] hover:bg-[#FFFAFA]/10 focus:ring-2 focus:ring-[#FFFAFA]/30">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent className="bg-[#020105]/95 border-[#FFFAFA]/30 backdrop-blur-md max-h-96 w-80">
          {Object.entries(modelCategories).map(([category, models]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-[#FFFAFA]/60 uppercase tracking-wider border-b border-[#FFFAFA]/10 flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
              </div>
              {models.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className="text-[#FFFAFA] hover:bg-[#FFFAFA]/10 focus:bg-[#FFFAFA]/10 cursor-pointer py-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{model.name}</span>
                      <span className="text-xs text-[#FFFAFA]/60">{model.provider}</span>
                    </div>
                    <Badge className={`ml-3 text-xs ${getModelBadgeColor(model.status)} px-2 py-1`}>
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
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        {/* UPDATED: Sidebar with New Conversation button moved inside */}
        <div className="hidden lg:block">
          <AppSidebar 
            onNewChat={handleNewChat} 
            onLoadChat={handleLoadChat} 
            onDeleteChat={handleDeleteChat} 
            currentChatId={currentChatId} 
            darkMode={darkMode} 
            onToggleDarkMode={handleToggleDarkMode} 
          />
        </div>
        
        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <AppSidebar 
            onNewChat={handleNewChat} 
            onLoadChat={handleLoadChat} 
            onDeleteChat={handleDeleteChat} 
            currentChatId={currentChatId} 
            darkMode={darkMode} 
            onToggleDarkMode={handleToggleDarkMode} 
          />
        </div>
        
        {/* UPDATED: Full-width chat container with models menu positioned beside sidebar */}
        <div className="flex-1 flex flex-col h-screen relative">
          {/* UPDATED: Models Menu positioned beside sidebar - REMOVED header, kept only models */}
          <div className="absolute top-4 left-4 lg:left-72 z-30 flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <div className="lg:hidden">
              <SidebarTrigger className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur-sm border border-border/30" />
            </div>
            
            {/* Models Menu Container - Styled to match reference image */}
            <div className="flex items-center gap-3 bg-[#020105]/95 backdrop-blur-md border border-[#FFFAFA]/30 rounded-xl px-4 py-3 shadow-lg">
              <div className="w-6 h-6 rounded border border-[#FFFAFA]/30 bg-[#FFFAFA]/10 flex items-center justify-center">
                <Cpu className="w-3 h-3 text-[#FFFAFA]" />
              </div>
              <span className="text-sm font-medium text-[#FFFAFA] hidden sm:block">Model</span>
              <div className="w-64 relative">
                <ModelsMenu selectedModel={selectedModel} onModelChange={setSelectedModel} />
              </div>
            </div>
          </div>

          {/* UPDATED: Main Content - Full Screen Chat (no header constraints) */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full">
              <EnhancedChatContainer 
                currentChatId={currentChatId} 
                selectedModel={selectedModel}
                onChatUpdate={handleChatUpdate} 
              />
            </div>
          </main>
        </div>
      </div>
      
      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarProvider>
  );
}