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
    toast({
      title: "Download App",
      description: "App download feature will be available soon.",
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
              <AvatarFallback className="bg-primary text-primary-foreground">S</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">Sujal</p>
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