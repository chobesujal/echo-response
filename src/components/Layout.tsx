import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { EnhancedChatContainer } from "./EnhancedChatContainer";
import { Button } from "@/components/ui/button";
import { Settings, Sparkles } from "lucide-react";

export function Layout() {
  const [currentChatId, setCurrentChatId] = useState<string>();
  const [darkMode, setDarkMode] = useState(false);

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
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  AI Chat Studio
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Settings</span>
              </Button>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-4 overflow-hidden">
            <div className="h-full max-w-6xl mx-auto">
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