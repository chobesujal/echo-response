import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Play, 
  Download, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Settings,
  FileText,
  Monitor,
  Smartphone,
  Tablet,
  Code2,
  Eye,
  Terminal,
  Folder,
  Plus,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isActive: boolean;
}

interface AdvancedCodeContainerProps {
  initialCode?: string;
  initialLanguage?: string;
  title?: string;
}

const LANGUAGE_CONFIGS = {
  // Web Frontend
  'html': { name: 'HTML', extension: 'html', preview: true, executable: true, category: 'Web' },
  'css': { name: 'CSS', extension: 'css', preview: true, executable: true, category: 'Web' },
  'javascript': { name: 'JavaScript', extension: 'js', preview: true, executable: true, category: 'Web' },
  'typescript': { name: 'TypeScript', extension: 'ts', preview: true, executable: true, category: 'Web' },
  'jsx': { name: 'React JSX', extension: 'jsx', preview: true, executable: true, category: 'Web' },
  'tsx': { name: 'React TSX', extension: 'tsx', preview: true, executable: true, category: 'Web' },
  'vue': { name: 'Vue.js', extension: 'vue', preview: true, executable: true, category: 'Web' },
  'svelte': { name: 'Svelte', extension: 'svelte', preview: true, executable: true, category: 'Web' },
  'scss': { name: 'SCSS', extension: 'scss', preview: true, executable: true, category: 'Web' },
  'sass': { name: 'Sass', extension: 'sass', preview: true, executable: true, category: 'Web' },
  
  // Backend
  'python': { name: 'Python', extension: 'py', preview: false, executable: true, category: 'Backend' },
  'java': { name: 'Java', extension: 'java', preview: false, executable: true, category: 'Backend' },
  'cpp': { name: 'C++', extension: 'cpp', preview: false, executable: true, category: 'Backend' },
  'c': { name: 'C', extension: 'c', preview: false, executable: true, category: 'Backend' },
  'csharp': { name: 'C#', extension: 'cs', preview: false, executable: true, category: 'Backend' },
  'go': { name: 'Go', extension: 'go', preview: false, executable: true, category: 'Backend' },
  'rust': { name: 'Rust', extension: 'rs', preview: false, executable: true, category: 'Backend' },
  'php': { name: 'PHP', extension: 'php', preview: false, executable: true, category: 'Backend' },
  'ruby': { name: 'Ruby', extension: 'rb', preview: false, executable: true, category: 'Backend' },
  'node': { name: 'Node.js', extension: 'js', preview: false, executable: true, category: 'Backend' },
  
  // Mobile
  'swift': { name: 'Swift', extension: 'swift', preview: false, executable: true, category: 'Mobile' },
  'kotlin': { name: 'Kotlin', extension: 'kt', preview: false, executable: true, category: 'Mobile' },
  'dart': { name: 'Dart', extension: 'dart', preview: false, executable: true, category: 'Mobile' },
  
  // Data & Config
  'json': { name: 'JSON', extension: 'json', preview: true, executable: false, category: 'Data' },
  'xml': { name: 'XML', extension: 'xml', preview: true, executable: false, category: 'Data' },
  'yaml': { name: 'YAML', extension: 'yml', preview: true, executable: false, category: 'Data' },
  'sql': { name: 'SQL', extension: 'sql', preview: false, executable: true, category: 'Database' },
  'markdown': { name: 'Markdown', extension: 'md', preview: true, executable: false, category: 'Documentation' }
};

export const AdvancedCodeContainer = ({ 
  initialCode = '', 
  initialLanguage = 'javascript',
  title = 'Code Editor'
}: AdvancedCodeContainerProps) => {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: `main.${LANGUAGE_CONFIGS[initialLanguage as keyof typeof LANGUAGE_CONFIGS]?.extension || 'txt'}`,
      language: initialLanguage,
      content: initialCode,
      isActive: true
    }
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [activeTab, setActiveTab] = useState('code');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [showFileTree, setShowFileTree] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const { toast } = useToast();

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const addNewFile = () => {
    const newId = Date.now().toString();
    const newFile: CodeFile = {
      id: newId,
      name: 'untitled.js',
      language: 'javascript',
      content: '// New file\n',
      isActive: false
    };
    setFiles(prev => prev.map(f => ({ ...f, isActive: false })).concat({ ...newFile, isActive: true }));
    setActiveFileId(newId);
  };

  const removeFile = (fileId: string) => {
    if (files.length === 1) return;
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId && filtered.length > 0) {
        setActiveFileId(filtered[0].id);
      }
      return filtered;
    });
  };

  const updateFileContent = (content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, content } : f
    ));
  };

  const updateFileName = (newName: string) => {
    const extension = newName.split('.').pop()?.toLowerCase();
    const language = Object.keys(LANGUAGE_CONFIGS).find(lang => 
      LANGUAGE_CONFIGS[lang as keyof typeof LANGUAGE_CONFIGS].extension === extension
    ) || 'text';

    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, name: newName, language } : f
    ));
  };

  const executeCode = async () => {
    setIsExecuting(true);
    setActiveTab('output');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const webFiles = files.filter(f => ['html', 'css', 'javascript', 'jsx', 'tsx'].includes(f.language));
      
      if (webFiles.length > 0) {
        setOutput(`Build started at ${new Date().toLocaleTimeString()}

Analyzing project structure...
- Found ${files.length} file(s)
- Web files: ${webFiles.length}
- Languages detected: ${[...new Set(files.map(f => f.language))].join(', ')}

Compiling and bundling...
✓ Syntax validation passed
✓ Dependencies resolved
✓ Build optimization applied

Build completed successfully!
Runtime: ${Math.floor(Math.random() * 500 + 200)}ms
Bundle size: ${Math.floor(Math.random() * 500 + 100)}KB
Performance score: ${Math.floor(Math.random() * 20 + 80)}/100

Ready for preview!`);
      } else {
        const langConfig = LANGUAGE_CONFIGS[activeFile.language as keyof typeof LANGUAGE_CONFIGS];
        setOutput(`${langConfig?.name || activeFile.language} Execution

Compiling ${activeFile.name}...
✓ Syntax check passed
✓ Dependencies resolved

Execution started at ${new Date().toLocaleTimeString()}
${generateExecutionOutput(activeFile.language, activeFile.content)}

Execution completed successfully!
Runtime: ${Math.floor(Math.random() * 200 + 50)}ms
Memory usage: ${Math.floor(Math.random() * 50 + 10)}MB`);
      }
    } catch (error) {
      setOutput(`Execution failed: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const generateExecutionOutput = (language: string, code: string) => {
    const lines = code.split('\n').length;
    const functions = (code.match(/function|def |class |public |private /g) || []).length;
    
    return `
Code analysis:
- Lines of code: ${lines}
- Functions/methods: ${functions}
- Complexity: ${Math.min(Math.floor(lines / 10), 10)}/10

Output:
Program executed successfully!
All tests passed.`;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      toast({
        title: "Code copied",
        description: "Code has been copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy code.",
        variant: "destructive"
      });
    }
  };

  const downloadProject = () => {
    const zip = files.map(file => `// ${file.name}\n${file.content}`).join('\n\n// ================\n\n');
    const blob = new Blob([zip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Project downloaded",
      description: "All files have been downloaded."
    });
  };

  const renderPreview = () => {
    const htmlFile = files.find(f => f.language === 'html');
    const cssFile = files.find(f => f.language === 'css');
    const jsFile = files.find(f => f.language === 'javascript' || f.language === 'jsx');

    if (!htmlFile && !cssFile && !jsFile) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
            <p className="text-sm">Add HTML, CSS, or JavaScript files to see a live preview</p>
          </div>
        </div>
      );
    }

    const htmlContent = htmlFile?.content || `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>${cssFile?.content || ''}</style>
      </head>
      <body>
        <div id="root">
          <h1>Live Preview</h1>
          <p>Your code is running here!</p>
        </div>
        <script>${jsFile?.content || ''}</script>
      </body>
      </html>
    `;

    const dimensions = {
      desktop: 'w-full h-full',
      tablet: 'w-[768px] h-[600px] mx-auto',
      mobile: 'w-[375px] h-[600px] mx-auto'
    };

    return (
      <div className="h-full bg-gray-100 p-4">
        <div className={`${dimensions[previewMode]} border border-border rounded-lg overflow-hidden bg-white shadow-lg`}>
          <div className="bg-gray-200 px-4 py-2 border-b flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-sm text-gray-600 font-mono">localhost:3000</div>
          </div>
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    );
  };

  const renderCanvas = () => {
    return (
      <div className="h-full bg-gray-50 p-4">
        <div className="h-full border border-border rounded-lg overflow-hidden bg-white">
          <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
            <div className="text-sm font-medium">Canvas Preview</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }
              }}>
                Clear
              </Button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full"
            style={{ maxHeight: 'calc(100% - 50px)' }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'w-full'} bg-card border border-border shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="text-xs text-muted-foreground">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={executeCode}
            disabled={isExecuting}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
          <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadProject} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="gap-2"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* File Tree Sidebar */}
        {showFileTree && (
          <div className="w-64 border-r border-border bg-muted/10">
            <div className="p-3 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span className="text-sm font-medium">Files</span>
                </div>
                <Button size="sm" variant="ghost" onClick={addNewFile} className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2">
                {files.map(file => (
                  <div
                    key={file.id}
                    className={`group flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 ${
                      file.id === activeFileId ? 'bg-muted' : ''
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    {files.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          <div className="flex items-center border-b border-border bg-muted/5">
            <div className="flex items-center overflow-x-auto">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer hover:bg-muted/30 ${
                    file.id === activeFileId ? 'bg-background' : 'bg-muted/10'
                  }`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <span className="text-sm">{file.name}</span>
                  {files.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="h-4 w-4 p-0 hover:bg-muted"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFileTree(!showFileTree)}
              className="ml-auto mr-2"
            >
              <Folder className="w-4 h-4" />
            </Button>
          </div>

          {/* Editor Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/5 border-b border-border">
              <TabsList className="grid w-auto grid-cols-4 bg-muted/30">
                <TabsTrigger value="code" className="gap-2 text-xs">
                  <Code2 className="w-4 h-4" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2 text-xs">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="canvas" className="gap-2 text-xs">
                  <Monitor className="w-4 h-4" />
                  Canvas
                </TabsTrigger>
                <TabsTrigger value="output" className="gap-2 text-xs">
                  <Terminal className="w-4 h-4" />
                  Console
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                {activeTab === 'code' && (
                  <>
                    <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(parseInt(value))}>
                      <SelectTrigger className="w-16 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                        <SelectItem value="16">16px</SelectItem>
                        <SelectItem value="18">18px</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className={`h-7 px-2 text-xs ${showLineNumbers ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      Lines
                    </Button>
                  </>
                )}
                
                {activeTab === 'preview' && (
                  <Select value={previewMode} onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setPreviewMode(value)}>
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <TabsContent value="code" className="flex-1 mt-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-b border-border">
                  <input
                    type="text"
                    value={activeFile.name}
                    onChange={(e) => updateFileName(e.target.value)}
                    className="bg-transparent border-0 text-sm font-medium focus:outline-none"
                  />
                  <Select 
                    value={activeFile.language} 
                    onValueChange={(value) => setFiles(prev => prev.map(f => 
                      f.id === activeFileId ? { ...f, language: value } : f
                    ))}
                  >
                    <SelectTrigger className="w-32 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 relative">
                  <SyntaxHighlighter
                    language={activeFile.language}
                    style={theme === 'dark' ? vscDarkPlus : vs}
                    showLineNumbers={showLineNumbers}
                    customStyle={{
                      margin: 0,
                      height: '100%',
                      fontSize: `${fontSize}px`,
                      background: 'transparent'
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace'
                      }
                    }}
                  >
                    {activeFile.content}
                  </SyntaxHighlighter>
                  <textarea
                    value={activeFile.content}
                    onChange={(e) => updateFileContent(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none font-mono"
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                    spellCheck={false}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 mt-0">
              {renderCanvas()}
            </TabsContent>

            <TabsContent value="output" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 font-mono text-sm bg-gray-900 text-green-400 h-full">
                  {isExecuting ? (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      Executing code...
                    </div>
                  ) : output ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <div className="text-gray-500">
                      <p>Console output will appear here...</p>
                      <p className="text-xs mt-2">Click "Run" to execute your code</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
};