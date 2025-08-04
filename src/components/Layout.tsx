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
    setCurrentChatId(Date.now().toString());
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
      <div className="min-h-screen flex w-full bg-gradient-bg">
        <AppSidebar 
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
          onDeleteChat={handleDeleteChat}
          currentChatId={currentChatId}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        
        <div className="flex-1 flex flex-col h-screen relative">
          {/* Sidebar Trigger */}
          <div className="flex items-center p-4 border-b border-sidebar-border bg-card/50 backdrop-blur-sm">
            <SidebarTrigger />
            <div className="flex items-center gap-2 ml-4">
              <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
              <h1 className="text-lg font-semibold">Cosmic AI Chat</h1>
            </div>
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
          
          {/* Floating Settings Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="bg-card/80 backdrop-blur-sm shadow-lg"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <SettingsDialog 
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}