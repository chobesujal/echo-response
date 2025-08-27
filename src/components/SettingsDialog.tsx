import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { Settings, Palette, MessageSquare, User, Download, Trash2, Archive, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    chatBubbleUI: true,
    displayUsername: false,
    widescreenMode: false,
    titleAutoGeneration: true,
    chatTagsAutoGeneration: true,
    autoCopyResponse: false,
    pasteLargeTextAsFile: true,
    fluidlyStreamLargeChunks: true
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleExportChats = () => {
    const chats = JSON.parse(localStorage.getItem('chat-history') || '[]');
    const dataStr = JSON.stringify(chats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat_history.json';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Chats Exported", description: "Your chat history has been downloaded." });
  };

  const handleImportChats = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const chats = JSON.parse(e.target?.result as string);
            localStorage.setItem('chat-history', JSON.stringify(chats));
            toast({ title: "Chats Imported", description: "Your chat history has been imported successfully." });
          } catch {
            toast({ title: "Error", description: "Invalid file format.", variant: "destructive" });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleArchiveAllChats = () => {
    const chats = JSON.parse(localStorage.getItem('chat-history') || '[]');
    const archivedChats = chats.map((chat: any) => ({ ...chat, archived: true }));
    localStorage.setItem('chat-history', JSON.stringify(archivedChats));
    toast({ title: "All Chats Archived", description: "All conversations have been archived." });
  };

  const handleDeleteAllChats = () => {
    localStorage.removeItem('chat-history');
    localStorage.removeItem('currentChatId');
    toast({ title: "All Chats Deleted", description: "Your chat history has been cleared.", variant: "destructive" });
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "interface", label: "Interface", icon: Palette },
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "about", label: "About", icon: User },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-muted/30 p-4 border-r">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg">Cosmic AI Settings</DialogTitle>
              <DialogDescription>Configure preferences, theme, and chat management.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <div className="flex space-x-2">
                    {["system", "dark", "light"].map((themeOption) => (
                      <Button
                        key={themeOption}
                        variant={theme === themeOption ? "default" : "outline"}
                        onClick={() => setTheme(themeOption)}
                        className="capitalize"
                      >
                        {themeOption}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Language</h3>
                  <Button variant="outline" className="w-48">
                    English (US) ▼
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Notifications</Label>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  />
                </div>
              </div>
            )}

            {activeTab === "interface" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">UI</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Chat Bubble UI</Label>
                      <Switch
                        checked={settings.chatBubbleUI}
                        onCheckedChange={(checked) => handleSettingChange('chatBubbleUI', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Display the username instead of You in the Chat</Label>
                      <Switch
                        checked={settings.displayUsername}
                        onCheckedChange={(checked) => handleSettingChange('displayUsername', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Widescreen Mode</Label>
                      <Switch
                        checked={settings.widescreenMode}
                        onCheckedChange={(checked) => handleSettingChange('widescreenMode', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Chat</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Title Auto-Generation</Label>
                      <Switch
                        checked={settings.titleAutoGeneration}
                        onCheckedChange={(checked) => handleSettingChange('titleAutoGeneration', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Chat Tags Auto-Generation</Label>
                      <Switch
                        checked={settings.chatTagsAutoGeneration}
                        onCheckedChange={(checked) => handleSettingChange('chatTagsAutoGeneration', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-Copy Response to Clipboard</Label>
                      <Switch
                        checked={settings.autoCopyResponse}
                        onCheckedChange={(checked) => handleSettingChange('autoCopyResponse', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Paste Large Text as File</Label>
                      <Switch
                        checked={settings.pasteLargeTextAsFile}
                        onCheckedChange={(checked) => handleSettingChange('pasteLargeTextAsFile', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Fluidly stream large external response chunks</Label>
                      <Switch
                        checked={settings.fluidlyStreamLargeChunks}
                        onCheckedChange={(checked) => handleSettingChange('fluidlyStreamLargeChunks', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chats" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Import Chats</Label>
                    <Button onClick={handleImportChats} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Chats
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Export Chats</Label>
                    <Button onClick={handleExportChats} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Chats
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Archive All Chats</Label>
                    <Button onClick={handleArchiveAllChats} variant="outline">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive All Chats
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Delete All Chats</Label>
                    <Button onClick={handleDeleteAllChats} variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Chats
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">About</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Cosmic AI</h4>
                      <p className="text-muted-foreground">A modern multi-model AI chat interface</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium">Developer</h4>
                      <p className="text-muted-foreground">Developed by sujalchobe</p>
                      <a 
                        href="https://instagram.com/sujalchobe" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @sujalchobe on Instagram
                      </a>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium">Version</h4>
                      <p className="text-muted-foreground">1.0.0</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}