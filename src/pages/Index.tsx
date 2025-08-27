import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Sparkles, ArrowRight, MessageSquare, Image, Video, Mic, Star, Globe, Users, Zap, Shield, Code, Palette, Camera, Music, FileText, Headphones, Brain, Search, Wand2 } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleEnterCosmos = () => {
    navigate("/chat");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/chat?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleServiceClick = (service: string) => {
    navigate(`/chat?service=${service}`);
  };

  return (
    <div className="min-h-screen bg-[#020105] relative overflow-hidden">
      {/* Animated Star Field Background */}
      <div className="absolute inset-0">
        {/* Static stars */}
        <div className="absolute inset-0 opacity-60">
          {Array.from({ length: 300 }).map((_, i) => (
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
        
        {/* Twinkling stars */}
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={`twinkle-${i}`}
              className="absolute w-0.5 h-0.5 bg-[#FFFAFA] rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Large Glowing Planet - Positioned to match reference */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Main planet sphere */}
          <div className="w-[900px] h-[900px] rounded-full bg-gradient-radial from-gray-800/40 via-gray-900/30 to-transparent opacity-90 blur-sm"></div>
          <div className="absolute inset-0 w-[900px] h-[900px] rounded-full bg-gradient-radial from-gray-700/25 via-gray-800/15 to-transparent"></div>
          
          {/* Outer glow effect */}
          <div className="absolute inset-0 w-[1100px] h-[1100px] -ml-[100px] -mt-[100px] rounded-full bg-gradient-radial from-transparent via-white/8 to-transparent blur-2xl"></div>
          
          {/* Inner glow */}
          <div className="absolute inset-0 w-[700px] h-[700px] ml-[100px] mt-[100px] rounded-full bg-gradient-radial from-white/5 via-transparent to-transparent blur-xl"></div>
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        {/* Logo - Exact match to reference */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Cosmic logo - cluster of dots forming constellation */}
            <div className="w-8 h-8 relative">
              <div className="absolute w-2 h-2 bg-[#FFFAFA] rounded-full top-0 left-3 opacity-90"></div>
              <div className="absolute w-1.5 h-1.5 bg-[#FFFAFA] rounded-full top-1 left-1 opacity-80"></div>
              <div className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full top-2 left-5 opacity-70"></div>
              <div className="absolute w-2 h-2 bg-[#FFFAFA] rounded-full top-3 left-2 opacity-85"></div>
              <div className="absolute w-1.5 h-1.5 bg-[#FFFAFA] rounded-full top-4 left-6 opacity-75"></div>
              <div className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full top-5 left-0 opacity-65"></div>
              <div className="absolute w-1.5 h-1.5 bg-[#FFFAFA] rounded-full top-6 left-4 opacity-80"></div>
            </div>
          </div>
          <span className="text-[#FFFAFA] text-xl font-bold tracking-wide">COSMIC AI</span>
        </div>

        {/* Navigation Links with Rich Dropdowns */}
        <div className="hidden md:flex items-center gap-8">
          {/* About Dropdown */}
          <div className="relative group">
            <a href="#about" className="text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors text-sm font-medium">
              About
            </a>
            <div className="absolute top-full left-0 mt-2 w-80 bg-[#FFFAFA]/10 backdrop-blur-md rounded-xl border border-[#FFFAFA]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-6 shadow-2xl">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[#FFFAFA] font-bold text-lg mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-400" />
                    Our Mission
                  </h4>
                  <p className="text-[#FFFAFA]/80 text-sm leading-relaxed">
                    Democratizing AI technology through intuitive, powerful tools that enhance human creativity and productivity. We believe AI should amplify human potential, not replace it.
                  </p>
                </div>
                <div>
                  <h4 className="text-[#FFFAFA] font-bold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Technology Stack
                  </h4>
                  <p className="text-[#FFFAFA]/80 text-sm leading-relaxed">
                    Built on cutting-edge AI models including GPT-5, Claude 4, DeepSeek R1, Gemini 2.0, and DALL-E 3. Our platform integrates the best of each model for optimal results.
                  </p>
                </div>
                <div>
                  <h4 className="text-[#FFFAFA] font-bold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    Our Team
                  </h4>
                  <p className="text-[#FFFAFA]/80 text-sm leading-relaxed">
                    Founded by AI researchers and engineers from leading tech companies, we're passionate about making AI accessible to everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1 text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors cursor-pointer text-sm font-medium">
              <span>Pricing</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="absolute top-full left-0 mt-2 w-96 bg-[#FFFAFA]/10 backdrop-blur-md rounded-xl border border-[#FFFAFA]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-6 shadow-2xl">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h4 className="text-[#FFFAFA] font-bold text-xl mb-2">Choose Your Plan</h4>
                  <p className="text-[#FFFAFA]/70 text-sm">Flexible pricing for individuals and teams</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#FFFAFA]/5 rounded-xl p-5 border border-[#FFFAFA]/10 hover:bg-[#FFFAFA]/8 transition-colors">
                    <div className="text-center mb-4">
                      <h5 className="text-[#FFFAFA] font-bold text-lg">Free</h5>
                      <p className="text-[#FFFAFA]/60 text-xs">Perfect for getting started</p>
                    </div>
                    <div className="text-center mb-4">
                      <span className="text-[#FFFAFA] text-3xl font-bold">$0</span>
                      <span className="text-[#FFFAFA]/60 text-sm">/month</span>
                    </div>
                    <ul className="text-[#FFFAFA]/70 text-xs space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        100 messages/month
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        Basic AI models
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        Community support
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        5 image generations
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-b from-blue-600/20 to-purple-600/20 rounded-xl p-5 border-2 border-blue-400/30 relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">Popular</span>
                    </div>
                    <div className="text-center mb-4">
                      <h5 className="text-[#FFFAFA] font-bold text-lg">Pro</h5>
                      <p className="text-[#FFFAFA]/60 text-xs">For power users</p>
                    </div>
                    <div className="text-center mb-4">
                      <span className="text-[#FFFAFA] text-3xl font-bold">$19</span>
                      <span className="text-[#FFFAFA]/60 text-sm">/month</span>
                    </div>
                    <ul className="text-[#FFFAFA]/70 text-xs space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        Unlimited messages
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        All AI models
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        Priority support
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        500 image generations
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        Advanced features
                      </li>
                    </ul>
                  </div>
                  <div className="bg-[#FFFAFA]/5 rounded-xl p-5 border border-[#FFFAFA]/10 hover:bg-[#FFFAFA]/8 transition-colors">
                    <div className="text-center mb-4">
                      <h5 className="text-[#FFFAFA] font-bold text-lg">Enterprise</h5>
                      <p className="text-[#FFFAFA]/60 text-xs">For organizations</p>
                    </div>
                    <div className="text-center mb-4">
                      <span className="text-[#FFFAFA] text-2xl font-bold">Custom</span>
                    </div>
                    <ul className="text-[#FFFAFA]/70 text-xs space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        Unlimited everything
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        Custom models
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        Dedicated support
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        API access
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resources Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1 text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors cursor-pointer text-sm font-medium">
              <span>Resources</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="absolute top-full left-0 mt-2 w-80 bg-[#FFFAFA]/10 backdrop-blur-md rounded-xl border border-[#FFFAFA]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-6 shadow-2xl">
              <div className="space-y-4">
                <a href="#docs" className="block p-4 rounded-lg hover:bg-[#FFFAFA]/5 transition-colors group/item">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h5 className="text-[#FFFAFA] font-bold">Documentation</h5>
                  </div>
                  <p className="text-[#FFFAFA]/70 text-sm">Complete guides, API references, and integration tutorials</p>
                </a>
                <a href="#tutorials" className="block p-4 rounded-lg hover:bg-[#FFFAFA]/5 transition-colors group/item">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-5 h-5 text-green-400" />
                    <h5 className="text-[#FFFAFA] font-bold">Learning Hub</h5>
                  </div>
                  <p className="text-[#FFFAFA]/70 text-sm">Step-by-step tutorials and AI best practices</p>
                </a>
                <a href="#community" className="block p-4 rounded-lg hover:bg-[#FFFAFA]/5 transition-colors group/item">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h5 className="text-[#FFFAFA] font-bold">Community</h5>
                  </div>
                  <p className="text-[#FFFAFA]/70 text-sm">Join our Discord, forums, and developer community</p>
                </a>
                <a href="#blog" className="block p-4 rounded-lg hover:bg-[#FFFAFA]/5 transition-colors group/item">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-orange-400" />
                    <h5 className="text-[#FFFAFA] font-bold">Blog & Updates</h5>
                  </div>
                  <p className="text-[#FFFAFA]/70 text-sm">Latest AI insights, updates, and industry news</p>
                </a>
                <a href="#support" className="block p-4 rounded-lg hover:bg-[#FFFAFA]/5 transition-colors group/item">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h5 className="text-[#FFFAFA] font-bold">Support Center</h5>
                  </div>
                  <p className="text-[#FFFAFA]/70 text-sm">Get help, report issues, and access premium support</p>
                </a>
              </div>
            </div>
          </div>
          
          {/* Products Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1 text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors cursor-pointer text-sm font-medium">
              <span>Products</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="absolute top-full left-0 mt-2 w-96 bg-[#FFFAFA]/10 backdrop-blur-md rounded-xl border border-[#FFFAFA]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h4 className="text-[#FFFAFA] font-bold text-xl mb-2">AI Product Suite</h4>
                  <p className="text-[#FFFAFA]/70 text-sm">Comprehensive AI tools for every creative need</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <a href="#askly" className="block p-4 rounded-xl hover:bg-[#FFFAFA]/5 transition-colors border border-[#FFFAFA]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-6 h-6 text-blue-400" />
                      <h5 className="text-[#FFFAFA] font-bold">Askly</h5>
                    </div>
                    <p className="text-[#FFFAFA]/70 text-sm mb-3">Advanced conversational AI for complex queries, reasoning, and problem-solving</p>
                    <div className="flex gap-1">
                      <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">Chat</span>
                      <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Reasoning</span>
                    </div>
                  </a>
                  <a href="#imagin" className="block p-4 rounded-xl hover:bg-[#FFFAFA]/5 transition-colors border border-[#FFFAFA]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Palette className="w-6 h-6 text-green-400" />
                      <h5 className="text-[#FFFAFA] font-bold">Imagin</h5>
                    </div>
                    <p className="text-[#FFFAFA]/70 text-sm mb-3">Create stunning images from text descriptions using DALL-E 3 and Midjourney</p>
                    <div className="flex gap-1">
                      <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">DALL-E</span>
                      <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">Art</span>
                    </div>
                  </a>
                  <a href="#motio" className="block p-4 rounded-xl hover:bg-[#FFFAFA]/5 transition-colors border border-[#FFFAFA]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Video className="w-6 h-6 text-purple-400" />
                      <h5 className="text-[#FFFAFA] font-bold">Motio</h5>
                    </div>
                    <p className="text-[#FFFAFA]/70 text-sm mb-3">Generate dynamic videos, animations, and motion graphics from text</p>
                    <div className="flex gap-1">
                      <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">Video</span>
                      <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded">Animation</span>
                    </div>
                  </a>
                  <a href="#voxa" className="block p-4 rounded-xl hover:bg-[#FFFAFA]/5 transition-colors border border-[#FFFAFA]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Headphones className="w-6 h-6 text-orange-400" />
                      <h5 className="text-[#FFFAFA] font-bold">Voxa</h5>
                    </div>
                    <p className="text-[#FFFAFA]/70 text-sm mb-3">Voice synthesis, audio generation, and speech-to-text capabilities</p>
                    <div className="flex gap-1">
                      <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded">Voice</span>
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded">Audio</span>
                    </div>
                  </a>
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-400/20">
                  <h6 className="text-[#FFFAFA] font-bold text-sm mb-2">🚀 Coming Soon</h6>
                  <p className="text-[#FFFAFA]/70 text-xs">Code generation, 3D modeling, music composition, and more exciting AI tools!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enter Cosmos Button */}
        <Button 
          onClick={handleEnterCosmos}
          className="bg-transparent border border-[#FFFAFA]/30 text-[#FFFAFA] hover:bg-[#FFFAFA]/10 hover:border-[#FFFAFA]/50 rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 backdrop-blur-sm"
        >
          Enter Cosmos
        </Button>
      </nav>

      {/* Main Content - Centered over planet */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-8">
        {/* Main Logo with Galaxy O - Exact match to reference */}
        <div className="text-center mb-12">
          <h1 className="text-7xl md:text-9xl font-bold text-[#FFFAFA] mb-6 tracking-tight">
            C
            <span className="relative inline-block mx-3">
              {/* Galaxy O - dark circle with stars inside, exactly like reference */}
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gray-900 border-2 border-gray-700 relative inline-flex items-center justify-center">
                {/* Stars inside the O - constellation pattern */}
                <div className="absolute w-1.5 h-1.5 bg-[#FFFAFA] rounded-full top-4 left-8 animate-pulse"></div>
                <div className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full top-6 left-5 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute w-1.5 h-1.5 bg-[#FFFAFA] rounded-full top-8 left-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full top-10 left-6 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute w-1.5 h-1.5 bg-[#FFFAFA] rounded-full top-12 left-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute w-0.5 h-0.5 bg-[#FFFAFA] rounded-full top-7 left-14 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                <div className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full top-14 left-8 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
                <div className="absolute w-0.5 h-0.5 bg-[#FFFAFA] rounded-full top-5 left-11 animate-pulse" style={{ animationDelay: '1.8s' }}></div>
              </div>
            </span>
            SMIC AI
          </h1>
          
          {/* Tagline - Exact match to reference */}
          <p className="text-[#FFFAFA]/70 text-xl md:text-2xl font-light tracking-wide">
            Images, Videos, Audio — One platform. Infinite possibilities.
          </p>
        </div>

        {/* Search Bar - Exact styling to match reference */}
        <div className="w-full max-w-3xl mb-10">
          <div className="relative">
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
              <Sparkles className="w-6 h-6 text-[#FFFAFA]/60" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask something..."
              className="w-full h-16 pl-16 pr-20 bg-[#FFFAFA]/10 border border-[#FFFAFA]/20 rounded-full text-[#FFFAFA] placeholder:text-[#FFFAFA]/50 focus:bg-[#FFFAFA]/15 focus:border-[#FFFAFA]/40 transition-all duration-300 text-lg backdrop-blur-sm"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-[#FFFAFA]/20 hover:bg-[#FFFAFA]/30 border border-[#FFFAFA]/30 p-0 transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5 text-[#FFFAFA]" />
            </Button>
          </div>
        </div>

        {/* Action Buttons - Exact match to reference */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Button
            onClick={() => handleServiceClick('askly')}
            className="bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 border border-[#FFFAFA]/20 hover:border-[#FFFAFA]/40 text-[#FFFAFA] rounded-full px-8 py-4 text-sm font-medium transition-all duration-300 backdrop-blur-sm"
          >
            Ask with Askly
          </Button>
          
          <Button
            onClick={() => handleServiceClick('imagin')}
            className="bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 border border-[#FFFAFA]/20 hover:border-[#FFFAFA]/40 text-[#FFFAFA] rounded-full px-8 py-4 text-sm font-medium transition-all duration-300 backdrop-blur-sm"
          >
            Imagin
          </Button>
          
          <Button
            onClick={() => handleServiceClick('motio')}
            className="bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 border border-[#FFFAFA]/20 hover:border-[#FFFAFA]/40 text-[#FFFAFA] rounded-full px-8 py-4 text-sm font-medium transition-all duration-300 backdrop-blur-sm"
          >
            Motio
          </Button>
          
          <Button
            onClick={() => handleServiceClick('voxa')}
            className="bg-[#FFFAFA]/10 hover:bg-[#FFFAFA]/20 border border-[#FFFAFA]/20 hover:border-[#FFFAFA]/40 text-[#FFFAFA] rounded-full px-8 py-4 text-sm font-medium transition-all duration-300 backdrop-blur-sm"
          >
            Voxa
          </Button>
        </div>

        {/* Subtle call to action */}
        <div className="text-center">
          <p className="text-[#FFFAFA]/50 text-sm mb-4">
            Experience the future of AI-powered creativity
          </p>
          <div className="flex items-center justify-center gap-3 text-[#FFFAFA]/40 text-xs">
            <div className="w-2 h-2 bg-[#FFFAFA]/40 rounded-full animate-pulse"></div>
            <span>Powered by advanced AI models</span>
            <div className="w-2 h-2 bg-[#FFFAFA]/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>•</span>
            <span>Trusted by 100,000+ users</span>
            <div className="w-2 h-2 bg-[#FFFAFA]/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>
      </div>

      {/* Floating particles animation */}
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

      {/* Additional cosmic elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Shooting stars */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`shooting-${i}`}
            className="absolute w-1 h-1 bg-[#FFFAFA] rounded-full opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animation: `shooting-star 3s linear infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shooting-star {
          0% {
            opacity: 0;
            transform: translateX(-100px) translateY(-100px);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(300px) translateY(300px);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;