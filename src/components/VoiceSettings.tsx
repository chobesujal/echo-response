import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceSettingsProps {
  children?: React.ReactNode;
}

const ELEVENLABS_VOICES = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
];

export const VoiceSettings = ({ children }: VoiceSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('9BWtsMINqrJLrRacOk9x');
  const [agentId, setAgentId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings
    const savedApiKey = localStorage.getItem('elevenlabs-api-key') || '';
    const savedVoice = localStorage.getItem('elevenlabs-voice') || '9BWtsMINqrJLrRacOk9x';
    const savedAgentId = localStorage.getItem('elevenlabs-agent-id') || '';
    
    setApiKey(savedApiKey);
    setSelectedVoice(savedVoice);
    setAgentId(savedAgentId);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your ElevenLabs API key",
        variant: "destructive"
      });
      return;
    }

    // Save settings
    localStorage.setItem('elevenlabs-api-key', apiKey);
    localStorage.setItem('elevenlabs-voice', selectedVoice);
    localStorage.setItem('elevenlabs-agent-id', agentId);

    toast({
      title: "Settings Saved",
      description: "Voice settings have been updated successfully"
    });
    
    setOpen(false);
  };

  const handleClear = () => {
    localStorage.removeItem('elevenlabs-api-key');
    localStorage.removeItem('elevenlabs-voice');
    localStorage.removeItem('elevenlabs-agent-id');
    
    setApiKey('');
    setSelectedVoice('9BWtsMINqrJLrRacOk9x');
    setAgentId('');
    
    toast({
      title: "Settings Cleared",
      description: "All voice settings have been removed"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Mic className="w-4 h-4 mr-2" />
            Voice Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Chat Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">ElevenLabs API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">elevenlabs.io</a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {ELEVENLABS_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID (Optional)</Label>
            <Input
              id="agentId"
              placeholder="Enter your ElevenLabs Agent ID"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Create an agent at ElevenLabs for advanced voice conversations
            </p>
          </div>

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear Settings
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};