import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Key, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  provider: string;
  key: string;
  displayName: string;
  description: string;
}

const API_PROVIDERS: ApiKey[] = [
  {
    provider: 'VITE_OPENAI_API_KEY',
    key: '',
    displayName: 'OpenAI',
    description: 'For GPT-4, GPT-3.5 Turbo models'
  },
  {
    provider: 'VITE_ANTHROPIC_API_KEY', 
    key: '',
    displayName: 'Anthropic',
    description: 'For Claude 3.5 Sonnet, Claude 3 Opus models'
  },
  {
    provider: 'VITE_GOOGLE_API_KEY',
    key: '',
    displayName: 'Google',
    description: 'For Gemini 2.0 Flash models'
  },
  {
    provider: 'VITE_DEEPSEEK_API_KEY',
    key: '',
    displayName: 'DeepSeek',
    description: 'For DeepSeek R1, DeepSeek V3 models'
  }
];

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
    return API_PROVIDERS.map(provider => ({
      ...provider,
      key: localStorage.getItem(provider.provider) || ''
    }));
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const updateApiKey = (provider: string, value: string) => {
    setApiKeys(prev => prev.map(api => 
      api.provider === provider ? { ...api, key: value } : api
    ));
  };

  const saveApiKey = (provider: string) => {
    const apiKey = apiKeys.find(api => api.provider === provider);
    if (apiKey) {
      if (apiKey.key.trim()) {
        localStorage.setItem(provider, apiKey.key.trim());
        toast({
          title: "API Key Saved",
          description: `${apiKey.displayName} API key has been saved securely.`
        });
      } else {
        localStorage.removeItem(provider);
        toast({
          title: "API Key Removed",
          description: `${apiKey.displayName} API key has been removed.`
        });
      }
    }
  };

  const removeApiKey = (provider: string) => {
    const apiKey = apiKeys.find(api => api.provider === provider);
    if (apiKey) {
      updateApiKey(provider, '');
      localStorage.removeItem(provider);
      toast({
        title: "API Key Removed",
        description: `${apiKey.displayName} API key has been removed.`
      });
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const hasValidKey = (key: string) => key.length > 10;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Add your API keys to enable real AI responses. Keys are stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiKeys.map((api) => (
          <div key={api.provider} className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={api.provider} className="text-sm font-medium">
                  {api.displayName}
                </Label>
                <p className="text-xs text-muted-foreground">{api.description}</p>
              </div>
              <Badge variant={hasValidKey(api.key) ? "default" : "secondary"}>
                {hasValidKey(api.key) ? "Connected" : "Not Set"}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={api.provider}
                  type={showKeys[api.provider] ? "text" : "password"}
                  value={api.key}
                  onChange={(e) => updateApiKey(api.provider, e.target.value)}
                  placeholder={`Enter ${api.displayName} API key...`}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggleShowKey(api.provider)}
                >
                  {showKeys[api.provider] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button
                onClick={() => saveApiKey(api.provider)}
                size="sm"
                variant="outline"
              >
                <Save className="w-4 h-4" />
              </Button>
              
              {hasValidKey(api.key) && (
                <Button
                  onClick={() => removeApiKey(api.provider)}
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Privacy & Security</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>API keys are stored locally in your browser only</li>
            <li>Keys are never sent to Cosmic AI servers</li>
            <li>Direct connections are made to AI providers</li>
            <li>You can remove keys anytime</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="text-sm font-medium mb-2">How to get API keys:</h4>
          <ul className="text-xs space-y-1">
            <li><strong>OpenAI:</strong> platform.openai.com/api-keys</li>
            <li><strong>Anthropic:</strong> console.anthropic.com/settings/keys</li>
            <li><strong>Google:</strong> aistudio.google.com/app/apikey</li>
            <li><strong>DeepSeek:</strong> platform.deepseek.com/api_keys</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}