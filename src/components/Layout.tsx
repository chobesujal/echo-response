import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { EnhancedChatContainer } from "./EnhancedChatContainer";
import { SettingsDialog } from "./SettingsDialog";
import { Button } from "@/components/ui/button";
import { Settings, Sparkles } from "lucide-react";

export function Layout() {
  const [currentChatId, setCurrentChatId] = useState<string>();
  const [darkMode, setDarkMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const handleNewChat = () => {
    const newChatId = `session-${Date.now()}`;
    setCurrentChatId(newChatId);
    
    // This will be handled by the chat container
  };

  const handleLoadChat = (chatId: string) => {
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

      // If current chat is being deleted, start a new chat
      if (currentChatId === chatId) {
        setCurrentChatId(Date.now().toString());
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
    // This is called when a chat is updated, could be used for real-time updates
    console.log('Chat updated:', { chatId, title, messageCount });
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - Hidden on mobile by default */}
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
        
        <div className="flex-1 flex flex-col h-screen relative">
          {/* Floating Settings Button - Mobile optimized */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              aria-label="Open settings" 
              onClick={() => setSettingsOpen(true)} 
              className="rounded-full bg-muted/80 backdrop-blur-sm border border-border/30 h-8 w-8 sm:h-10 sm:w-10"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          </div>
          
          {/* Floating Sidebar Trigger for Mobile */}
          <div className="absolute top-3 left-3 z-10 lg:hidden">
            <SidebarTrigger className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur-sm border border-border/30" />
          </div>

          {/* Main Content - Full Screen Chat */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full">
              <EnhancedChatContainer 
                currentChatId={currentChatId} 
                onChatUpdate={handleChatUpdate} 
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}