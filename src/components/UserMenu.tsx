import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Archive, Download, LogOut } from "lucide-react";
import { SettingsDialog } from "./SettingsDialog";
import { useToast } from "@/hooks/use-toast";

export function UserMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  const handleDownloadApp = () => {
    // Create download links for Windows and Android apps
    const windowsAppUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(`
Cosmic AI Windows App

To install Cosmic AI on Windows:

1. Download the installer: cosmic-ai-setup.exe
2. Run the installer as administrator
3. Follow the installation wizard
4. Launch Cosmic AI from Start Menu

System Requirements:
- Windows 10 or later
- 4GB RAM minimum
- 500MB free disk space
- Internet connection required

Note: This is a placeholder. The actual Windows app is in development.
Contact: sujalchobe@gmail.com
    `);
    
    const androidAppUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(`
Cosmic AI Android App

To install Cosmic AI on Android:

1. Download the APK: cosmic-ai.apk
2. Enable "Install from unknown sources" in Settings
3. Install the APK file
4. Launch Cosmic AI from app drawer

System Requirements:
- Android 7.0 or later
- 2GB RAM minimum
- 100MB free storage
- Internet connection required

Note: This is a placeholder. The actual Android app is in development.
Contact: sujalchobe@gmail.com
    `);

    // Create download menu
    const downloadMenu = document.createElement('div');
    downloadMenu.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000; max-width: 400px;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Download Cosmic AI</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="${windowsAppUrl}" download="cosmic-ai-windows-info.txt" style="padding: 10px 15px; background: #0078d4; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
            📱 Download for Windows
          </a>
          <a href="${androidAppUrl}" download="cosmic-ai-android-info.txt" style="padding: 10px 15px; background: #34a853; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
            🤖 Download for Android
          </a>
          <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 15px; background: #f1f3f4; border: none; border-radius: 5px; cursor: pointer;">
            Close
          </button>
        </div>
        <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">Apps are currently in development. These downloads contain installation instructions.</p>
      </div>
    `;
    document.body.appendChild(downloadMenu);
    
    toast({
      title: "Download Options",
      description: "Choose your platform to download Cosmic AI app.",
    });
  };

  const handleArchivedChats = () => {
    toast({
      title: "Archived Chats",
      description: "Viewing archived conversations.",
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">S</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">Sujal</p>
              <p className="text-xs text-muted-foreground">@sujalchobe</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchivedChats}>
            <Archive className="mr-2 h-4 w-4" />
            Archived Chats
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadApp}>
            <Download className="mr-2 h-4 w-4" />
            Download the App
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}