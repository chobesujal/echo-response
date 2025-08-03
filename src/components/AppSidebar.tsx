import { useState, useEffect } from "react";
import { MessageSquare, Plus, Settings, Trash2, Moon, Sun, Download, Upload } from "lucide-react";
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
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        {/* New Chat Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={onNewChat}
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {!collapsed && <span>New Chat</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
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

        {/* Settings and Actions */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onToggleDarkMode}>
                  {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={exportChats}>
                  <Download className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Export Chats</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={importChats}>
                  <Upload className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Import Chats</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}