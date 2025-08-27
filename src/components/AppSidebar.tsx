import { useState, useEffect } from "react";
import { MessageSquare, Plus, Settings, Trash2, Moon, Sun, Download, Upload, Sparkles, Wand2 } from "lucide-react";
import { UserMenu } from "./UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface AppSidebarProps {
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  currentChatId?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AppSidebar({ 
  onNewChat, 
  onLoadChat, 
  onDeleteChat, 
  currentChatId, 
  darkMode, 
  onToggleDarkMode 
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = () => {
    try {
      const savedChats = localStorage.getItem('chat-history');
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        setChatHistory(parsed.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(chatId);
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    toast({
      title: "Chat deleted",
      description: "Chat history has been removed."
    });
  };

  const exportChats = () => {
    try {
      const dataStr = JSON.stringify(chatHistory, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Chats exported",
        description: "Chat history has been downloaded as JSON."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export chat history.",
        variant: "destructive"
      });
    }
  };

  const importChats = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const importedChats = JSON.parse(content);
            
            // Validate and merge with existing chats
            const validChats = importedChats.filter((chat: any) => 
              chat.id && chat.title && chat.timestamp
            );
            
            const mergedChats = [...chatHistory, ...validChats];
            const uniqueChats = mergedChats.filter((chat, index, self) => 
              index === self.findIndex(c => c.id === chat.id)
            );
            
            setChatHistory(uniqueChats);
            localStorage.setItem('chat-history', JSON.stringify(uniqueChats));
            
            toast({
              title: "Chats imported",
              description: `Imported ${validChats.length} chat(s) successfully.`
            });
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Invalid file format or corrupted data.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} border-r border-border/30`}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        {/* Header with Cosmic AI branding */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 py-3 border-b border-sidebar-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  {/* Cosmic logo - cluster of dots */}
                  <div className="w-6 h-6 relative">
                    <div className="absolute w-1.5 h-1.5 bg-sidebar-foreground rounded-full top-0 left-2"></div>
                    <div className="absolute w-1 h-1 bg-sidebar-foreground rounded-full top-1 left-0"></div>
                    <div className="absolute w-0.5 h-0.5 bg-sidebar-foreground rounded-full top-1 left-4"></div>
                    <div className="absolute w-1.5 h-1.5 bg-sidebar-foreground rounded-full top-2 left-1"></div>
                    <div className="absolute w-1 h-1 bg-sidebar-foreground rounded-full top-3 left-4"></div>
                    <div className="absolute w-0.5 h-0.5 bg-sidebar-foreground rounded-full top-4 left-0"></div>
                    <div className="absolute w-1 h-1 bg-sidebar-foreground rounded-full top-4 left-3"></div>
                  </div>
                </div>
                {!collapsed && <h2 className="text-lg font-semibold text-sidebar-foreground">COSMIC AI</h2>}
              </div>
              
              {/* UPDATED: New Chat Button - Moved from header, enhanced styling */}
              <SidebarMenuButton 
                onClick={onNewChat}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 gap-2 rounded-lg shadow-lg transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4 animate-pulse" />
                {!collapsed && <span>New conversation</span>}
              </SidebarMenuButton>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History */}
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatHistory.slice(0, 10).map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className={`group relative w-full ${currentChatId === chat.id ? 'bg-sidebar-accent rounded-md' : ''}`}>
                    <SidebarMenuButton 
                      onClick={() => onLoadChat(chat.id)}
                      className="w-full justify-start pr-8"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {chat.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {chat.messageCount} messages
                            </div>
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                    {!collapsed && (
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6 rounded hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Import/Export Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Data Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={exportChats}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Chats
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={importChats}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Chats
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Profile and Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center justify-between w-full p-2">
                  <UserMenu />
                  {!collapsed && (
                    <SidebarMenuButton onClick={onToggleDarkMode} className="ml-auto">
                      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </SidebarMenuButton>
                  )}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}