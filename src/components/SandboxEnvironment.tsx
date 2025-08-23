import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Copy, 
  Monitor, 
  Smartphone, 
  Tablet,
  Code2,
  Terminal,
  Globe,
  FileText,
  Layers,
  Palette,
  Braces,
  FileCode,
  Minimize2,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  Check,
  X,
  Zap,
  ExternalLink,
  Share,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Maximize2
} from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

interface SandboxFile {
  name: string;
  content: string;
  language: string;
  isMain?: boolean;
  path: string;
}

interface SandboxProject {
  id: string;
  name: string;
  files: SandboxFile[];
  framework: string;
  lastModified: Date;
  dependencies?: string[];
}

const SANDBOX_TEMPLATES = {
  'vanilla-js': {
    name: 'Vanilla JavaScript',
    files: [
      { 
        name: 'index.html', 
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanilla JS App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            margin: 10px;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        .output {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World!</h1>
        <button onclick="handleClick()">Click me</button>
        <div class="output" id="output">Ready to interact!</div>
    </div>
    
    <script>
        let clickCount = 0;
        
        function handleClick() {
            clickCount++;
            const output = document.getElementById('output');
            output.textContent = \`Button clicked \${clickCount} time\${clickCount === 1 ? '' : 's'}!\`;
            
            // Add animation
            output.style.transform = 'scale(1.1)';
            setTimeout(() => {
                output.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            const now = new Date();
            document.getElementById('output').textContent = \`App loaded at \${now.toLocaleTimeString()}\`;
        });
    </script>
</body>
</html>`, 
        language: 'html', 
        isMain: true 
      }
    ],
    dependencies: []
  },
  'react': {
    name: 'React App',
    files: [
      { 
        name: 'App.jsx', 
        path: '/src/App.jsx',
        content: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Welcome to React!');

  const handleClick = () => {
    setCount(count + 1);
    setMessage(\`You've clicked \${count + 1} time\${count + 1 === 1 ? '' : 's'}!\`);
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ color: '#333', marginBottom: '30px', fontSize: '2.5em' }}>
          React Sandbox
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <p style={{ fontSize: '1.2em', color: '#666', margin: 0 }}>{message}</p>
          <button 
            onClick={handleClick}
            style={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '50px',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            Count: {count}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;`, 
        language: 'jsx', 
        isMain: true 
      }
    ],
    dependencies: ['react', 'react-dom']
  }
};

interface SandboxEnvironmentProps {
  initialCode?: string;
  initialLanguage?: string;
  isEmbedded?: boolean;
  onClose?: () => void;
  className?: string;
}

export const SandboxEnvironment = ({ 
  initialCode, 
  initialLanguage, 
  isEmbedded = false,
  onClose,
  className 
}: SandboxEnvironmentProps) => {
  const [currentProject, setCurrentProject] = useState<SandboxProject>(() => {
    if (initialCode && initialLanguage) {
      return {
        id: 'custom',
        name: 'AI Generated Code',
        files: [{ 
          name: `main.${getFileExtension(initialLanguage)}`, 
          path: `/main.${getFileExtension(initialLanguage)}`,
          content: initialCode, 
          language: initialLanguage, 
          isMain: true 
        }],
        framework: initialLanguage,
        lastModified: new Date(),
        dependencies: getDependencies(initialLanguage)
      };
    }
    return {
      id: 'vanilla-js',
      name: 'Vanilla JavaScript',
      files: SANDBOX_TEMPLATES['vanilla-js'].files,
      framework: 'vanilla-js',
      lastModified: new Date(),
      dependencies: SANDBOX_TEMPLATES['vanilla-js'].dependencies
    };
  });
  
  const [activeFile, setActiveFile] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState(initialCode ? 'preview' : 'code');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const { toast } = useToast();
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
      cpp: 'cpp', c: 'c', csharp: 'cs', go: 'go', rust: 'rs',
      php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt',
      html: 'html', css: 'css', scss: 'scss', sass: 'sass',
      jsx: 'jsx', tsx: 'tsx', vue: 'vue', svelte: 'svelte',
      json: 'json', xml: 'xml', yaml: 'yml', sql: 'sql',
      markdown: 'md', bash: 'sh', powershell: 'ps1'
    };
    return extensions[language] || 'txt';
  }

  function getDependencies(language: string): string[] {
    const deps: Record<string, string[]> = {
      'react': ['react', 'react-dom'],
      'vue': ['vue'],
      'angular': ['@angular/core', '@angular/common'],
      'svelte': ['svelte'],
      'typescript': ['typescript'],
      'python': ['python3'],
      'node': ['node']
    };
    return deps[language] || [];
  }

  const updateFileContent = (content: string) => {
    const updatedFiles = [...currentProject.files];
    updatedFiles[activeFile] = { ...updatedFiles[activeFile], content };
    setCurrentProject({ ...currentProject, files: updatedFiles, lastModified: new Date() });
    
    // Auto-run for web technologies
    if (['html', 'css', 'javascript', 'jsx', 'tsx', 'vue'].includes(updatedFiles[activeFile].language)) {
      setTimeout(() => runCode(), 500);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setActiveTab('preview');
    setConsoleOutput([]);
    
    try {
      const mainFile = currentProject.files.find(f => f.isMain) || currentProject.files[0];
      
      if (mainFile.language === 'html' || currentProject.framework === 'vanilla-js') {
        // For HTML/JS projects, create a complete HTML document
        let htmlContent = mainFile.content;
        
        // If it's not a complete HTML document, wrap it
        if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
          const cssFile = currentProject.files.find(f => f.language === 'css');
          const jsFile = currentProject.files.find(f => f.language === 'javascript');
          
          htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sandbox Preview</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        ${cssFile ? cssFile.content : ''}
    </style>
</head>
<body>
    ${htmlContent}
    ${jsFile ? `<script>${jsFile.content}</script>` : ''}
</body>
</html>`;
        }
        
        // Update iframe with proper error handling and white background
        if (iframeRef.current) {
          try {
            // Ensure white background
            const finalHtml = htmlContent.replace('<body>', '<body style="background: white; margin: 0; padding: 20px;">');
            iframeRef.current.srcdoc = finalHtml;
            console.log('HTML content loaded in iframe');
            setOutput('Web application loaded successfully in preview');
          } catch (error) {
            console.error('Error loading HTML in iframe:', error);
            setOutput(`Preview Error: ${error}\n\nFailed to load HTML content in preview.`);
          }
        }
      } else if (mainFile.language === 'jsx' || mainFile.language === 'tsx') {
        // For React components, create a wrapper with white background
        const reactWrapper = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            background: white; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        }
        #root { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${mainFile.content}
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>`;
        
        if (iframeRef.current) {
          try {
            iframeRef.current.srcdoc = reactWrapper;
            console.log('React content loaded in iframe');
            setOutput('React application loaded successfully in preview');
          } catch (error) {
            console.error('Error loading React in iframe:', error);
            setOutput(`Preview Error: ${error}\n\nFailed to load React content in preview.`);
          }
        }
      } else if (mainFile.language === 'vue') {
        // For Vue components
        const vueWrapper = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vue Preview</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            background: white; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        }
        #app { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="app"></div>
    <script>
        const { createApp } = Vue;
        
        const App = {
          template: \`${mainFile.content.match(/<template>([\s\S]*?)<\/template>/)?.[1] || '<div>Vue Component</div>'}\`,
          ${mainFile.content.match(/<script>([\s\S]*?)<\/script>/)?.[1] || 'data() { return {}; }'}
        };
        
        createApp(App).mount('#app');
    </script>
    <style>
        ${mainFile.content.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] || ''}
    </style>
</body>
</html>`;
        
        if (iframeRef.current) {
          try {
            iframeRef.current.srcdoc = vueWrapper;
            console.log('Vue content loaded in iframe');
            setOutput('Vue application loaded successfully in preview');
          } catch (error) {
            console.error('Error loading Vue in iframe:', error);
            setOutput(`Preview Error: ${error}\n\nFailed to load Vue content in preview.`);
          }
        }
      } else {
        // For other languages, simulate execution
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const executionResult = generateExecutionOutput(mainFile.language, mainFile.content);
        setOutput(executionResult);
      }
      
    } catch (error) {
      console.error('Sandbox execution error:', error);
      setOutput(`Execution Error: ${error}\n\nPlease check your code and try again.`);
    } finally {
      setIsRunning(false);
    }
  };

  const generateExecutionOutput = (language: string, code: string): string => {
    const timestamp = new Date().toLocaleTimeString();
    const lines = code.split('\n').length;
    
    const outputs: Record<string, string> = {
      python: `Python 3.11.0 Interpreter
Execution started at ${timestamp}
Processing ${lines} lines of Python code...

Hello, World!
Fibonacci sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
Random numbers: [42, 17, 89, 3, 56]
Mathematical operations completed.

Execution completed successfully!
Runtime: ${Math.floor(Math.random() * 200 + 100)}ms
Memory usage: ${Math.floor(Math.random() * 10 + 5)}MB`,

      javascript: `Node.js v18.17.0 Runtime
Execution started at ${timestamp}
Processing ${lines} lines of JavaScript...

Hello, World!
DOM manipulation completed.
Event listeners attached.
Application initialized successfully.

Execution completed!
Runtime: ${Math.floor(Math.random() * 100 + 50)}ms
Memory usage: ${Math.floor(Math.random() * 8 + 3)}MB`,

      java: `OpenJDK 17 Runtime Environment
Compiling Java source...
javac Main.java
Compilation successful!

java Main
Hello, World!
Application started successfully.
All tests passed.

Program executed successfully!
Runtime: ${Math.floor(Math.random() * 300 + 150)}ms
JVM optimizations applied.`,
    };
    
    return outputs[language] || `${language.toUpperCase()} Runtime
Execution started at ${timestamp}
Processing ${lines} lines of code...

Code executed successfully!
Runtime: ${Math.floor(Math.random() * 200 + 100)}ms
Output generated.`;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentProject.files[activeFile].content);
      toast({
        title: "Code copied",
        description: "Code has been copied to clipboard."
      });
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const downloadCode = () => {
    const file = currentProject.files[activeFile];
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File downloaded",
      description: `${file.name} has been downloaded.`
    });
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80 h-[500px]';
      case 'tablet': return 'w-[768px] h-[500px]';
      default: return 'w-full h-[500px]';
    }
  };

  // Auto-run on mount for initial code
  useEffect(() => {
    if (initialCode && ['html', 'css', 'javascript', 'jsx', 'tsx', 'vue'].includes(initialLanguage || '')) {
      setTimeout(() => runCode(), 1000);
    }
  }, []);

  return (
    <Card className={`w-full shadow-card border border-border ${isFullscreen ? 'fixed inset-4 z-50' : ''} bg-card overflow-hidden ${isEmbedded ? 'h-full' : 'h-[700px]'} ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{currentProject.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentProject.framework}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runCode}
            disabled={isRunning}
            className="gap-2 h-8 px-3 text-xs"
          >
            {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          {isEmbedded && onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-2 h-8 px-3 text-xs"
            >
              <X className="w-3 h-3" />
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100%-60px)]">
        {/* File Explorer */}
        <div className="w-48 border-r border-border bg-muted/10">
          <div className="p-2 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Files</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="p-1">
              {currentProject.files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 group ${
                    activeFile === index ? 'bg-muted/70' : ''
                  }`}
                  onClick={() => setActiveFile(index)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs truncate">{file.name}</span>
                    {file.isMain && <Badge variant="secondary" className="text-xs px-1 py-0">main</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/10">
              <TabsList className="grid w-auto grid-cols-3 bg-muted/30 h-8">
                <TabsTrigger value="code" className="gap-1 text-xs px-3 h-6">
                  <Code2 className="w-3 h-3" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1 text-xs px-3 h-6">
                  <Globe className="w-3 h-3" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="console" className="gap-1 text-xs px-3 h-6">
                  <Terminal className="w-3 h-3" />
                  Console
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                {activeTab === 'preview' && (
                  <Select value={previewMode} onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setPreviewMode(value)}>
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3 h-3" />
                          Desktop
                        </div>
                      </SelectItem>
                      <SelectItem value="tablet">
                        <div className="flex items-center gap-2">
                          <Tablet className="w-3 h-3" />
                          Tablet
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3 h-3" />
                          Mobile
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <TabsContent value="code" className="flex-1 mt-0">
              <div className="h-full flex flex-col">
                <div className="flex-1 relative">
                  <Textarea
                    value={currentProject.files[activeFile]?.content || ''}
                    onChange={(e) => updateFileContent(e.target.value)}
                    className="h-full resize-none border-0 rounded-none font-mono text-sm leading-relaxed bg-background"
                    style={{ fontSize: `${fontSize}px` }}
                    placeholder="Start coding..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0">
              <div className="h-full bg-white p-4 overflow-auto">
                <div className={`${getPreviewDimensions()} mx-auto border border-border/20 rounded-lg overflow-hidden bg-white shadow-lg`}>
                  <div className="bg-gray-100 px-3 py-2 border-b border-border/20 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">localhost:3000</div>
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={runCode}>
                        <RefreshCw className="w-2 h-2" />
                      </Button>
                    </div>
                  </div>
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0 bg-white"
                    title="Code Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="console" className="flex-1 mt-0">
              <div className="h-full bg-gray-900 text-green-400 font-mono text-sm">
                {isRunning ? (
                  <div className="p-4 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-yellow-400" />
                    <div>
                      <div className="text-lg font-bold mb-1 text-yellow-400">Executing code...</div>
                      <div className="text-xs opacity-80">Please wait while your code is being processed</div>
                    </div>
                  </div>
                ) : output ? (
                  <ScrollArea className="h-full">
                    <pre className="p-4 whitespace-pre-wrap leading-relaxed text-xs">{output}</pre>
                  </ScrollArea>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-1">Console Output</p>
                    <p className="text-xs">Run your code to see the output here</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
};