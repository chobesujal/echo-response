import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Wand2, 
  Download, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  Image as ImageIcon,
  ArrowLeft,
  Save,
  Share,
  Heart,
  Eye,
  Zap,
  Star,
  Trash2,
  Grid,
  List,
  Filter,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
  liked?: boolean;
}

const DALL_E_PROMPTS = [
  "A futuristic city at sunset with flying cars",
  "A magical forest with glowing mushrooms and fairy lights",
  "A steampunk robot playing chess in a Victorian library",
  "An underwater palace with coral gardens and mermaids",
  "A space station orbiting a purple planet with rings",
  "A cyberpunk street market with neon signs and holograms",
  "A medieval castle floating in the clouds",
  "A bioluminescent jungle with exotic alien creatures"
];

export default function DallE() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const navigate = useNavigate();
  const promptInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Generating image with DALL-E:', prompt);
      
      // Use Puter's txt2img API exactly as documented
      const imageElement = await (window as any).puter.ai.txt2img(prompt.trim(), false);
      
      if (!imageElement || !imageElement.src) {
        throw new Error('No image element received from DALL-E API');
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        imageUrl: imageElement.src,
        timestamp: new Date()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setActiveTab("gallery");
      
      toast({
        title: "Image Generated!",
        description: "Your AI-generated image is ready.",
      });

      // Save to localStorage
      const saved = localStorage.getItem('dalle-images');
      const images = saved ? JSON.parse(saved) : [];
      images.unshift(newImage);
      localStorage.setItem('dalle-images', JSON.stringify(images.slice(0, 50))); // Keep last 50

    } catch (error) {
      console.error('DALL-E generation error:', error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmic-ai-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Image Downloaded",
        description: "Image saved to your device."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download image.",
        variant: "destructive"
      });
    }
  };

  const copyImageUrl = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast({
        title: "URL Copied",
        description: "Image URL copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy image URL.",
        variant: "destructive"
      });
    }
  };

  const toggleLike = (imageId: string) => {
    setGeneratedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, liked: !img.liked } : img
    ));
  };

  return (
    <div className="min-h-screen bg-[#020105] relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-[#FFFAFA]/20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/chat')}
            className="text-[#FFFAFA] hover:bg-[#FFFAFA]/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-[#FFFAFA]">DALL-E Studio</h1>
              <p className="text-[#FFFAFA]/60 text-sm">AI-Powered Image Generation</p>
            </div>
          </div>
        </div>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          Powered by DALL-E 3
        </Badge>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#FFFAFA]/10 border border-[#FFFAFA]/20">
            <TabsTrigger value="generate" className="data-[state=active]:bg-[#FFFAFA]/20 text-[#FFFAFA]">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-[#FFFAFA]/20 text-[#FFFAFA]">
              <ImageIcon className="w-4 h-4 mr-2" />
              Gallery ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Generation Panel */}
              <Card className="bg-[#FFFAFA]/5 border-[#FFFAFA]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFFAFA] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Create Your Vision
                  </CardTitle>
                  <CardDescription className="text-[#FFFAFA]/60">
                    Describe the image you want to generate in detail
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      ref={promptInputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="A majestic dragon flying over a crystal mountain..."
                      className="bg-[#020105]/50 border-[#FFFAFA]/30 text-[#FFFAFA] placeholder-[#FFFAFA]/50"
                      disabled={isGenerating}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>

                  {/* Quick Prompts */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-[#FFFAFA]">Quick Prompts:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {DALL_E_PROMPTS.slice(0, 4).map((quickPrompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setPrompt(quickPrompt)}
                          className="justify-start text-left h-auto p-3 bg-[#FFFAFA]/5 border-[#FFFAFA]/20 text-[#FFFAFA] hover:bg-[#FFFAFA]/10"
                          disabled={isGenerating}
                        >
                          <Sparkles className="w-3 h-3 mr-2 text-purple-400" />
                          <span className="text-xs">{quickPrompt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card className="bg-[#FFFAFA]/5 border-[#FFFAFA]/20">
                <CardHeader>
                  <CardTitle className="text-[#FFFAFA] flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-[#FFFAFA]/5 border-2 border-dashed border-[#FFFAFA]/20 rounded-lg flex items-center justify-center">
                    {isGenerating ? (
                      <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                        <p className="text-[#FFFAFA] font-medium">Generating your image...</p>
                        <p className="text-[#FFFAFA]/60 text-sm mt-2">This may take 10-30 seconds</p>
                      </div>
                    ) : generatedImages.length > 0 ? (
                      <div className="w-full h-full relative">
                        <img
                          src={generatedImages[0].imageUrl}
                          alt={generatedImages[0].prompt}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm rounded p-2">
                          <p className="text-white text-xs truncate">{generatedImages[0].prompt}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 text-[#FFFAFA]/30 mx-auto mb-4" />
                        <p className="text-[#FFFAFA]/60">Your generated image will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <div className="space-y-4">
              {/* Gallery Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#FFFAFA]">Your Creations</h2>
                  <p className="text-[#FFFAFA]/60">Generated images from your prompts</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="bg-[#FFFAFA]/5 border-[#FFFAFA]/20 text-[#FFFAFA]"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Gallery Content */}
              {generatedImages.length === 0 ? (
                <Card className="bg-[#FFFAFA]/5 border-[#FFFAFA]/20">
                  <CardContent className="py-12 text-center">
                    <ImageIcon className="w-16 h-16 text-[#FFFAFA]/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#FFFAFA] mb-2">No Images Yet</h3>
                    <p className="text-[#FFFAFA]/60 mb-4">Start generating amazing images with AI</p>
                    <Button
                      onClick={() => setActiveTab("generate")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate First Image
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {generatedImages.map((image) => (
                    <Card key={image.id} className="bg-[#FFFAFA]/5 border-[#FFFAFA]/20 overflow-hidden group hover:bg-[#FFFAFA]/10 transition-all">
                      <div className="aspect-square relative">
                        <img
                          src={image.imageUrl}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(image.imageUrl, image.prompt)}
                              className="bg-white/90 text-black hover:bg-white"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyImageUrl(image.imageUrl)}
                              className="bg-white/90 text-black hover:bg-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleLike(image.id)}
                              className={`${image.liked ? 'bg-red-500 text-white' : 'bg-white/90 text-black'} hover:bg-red-500 hover:text-white`}
                            >
                              <Heart className={`w-4 h-4 ${image.liked ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-[#FFFAFA] text-sm line-clamp-2 mb-2">{image.prompt}</p>
                        <div className="flex items-center justify-between text-xs text-[#FFFAFA]/60">
                          <span>{image.timestamp.toLocaleDateString()}</span>
                          <Badge variant="outline" className="text-xs">DALL-E 3</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-[#FFFAFA]/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 15}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}