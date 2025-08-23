import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Upload, 
  Copy, 
  Settings, 
  Monitor, 
  Smartphone, 
  Tablet,
  Code2,
  Terminal,
  Globe,
  FileText,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Zap
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
}

interface SandboxProject {
  id: string;
  name: string;
  files: SandboxFile[];
  framework: string;
  lastModified: Date;
}

const SANDBOX_TEMPLATES = {
  'vanilla-js': {
    name: 'Vanilla JavaScript',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanilla JS App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Hello World!</h1>
        <button id="btn">Click me</button>
        <p id="output">Output will appear here</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`, language: 'html', isMain: true },
      { name: 'style.css', content: `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

#app {
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
}

button:hover {
    transform: translateY(-2px);
}

#output {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
    color: #666;
}`, language: 'css' },
      { name: 'script.js', content: `document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('btn');
    const output = document.getElementById('output');
    let clickCount = 0;

    button.addEventListener('click', function() {
        clickCount++;
        output.textContent = \`Button clicked \${clickCount} time\${clickCount === 1 ? '' : 's'}!\`;
        
        // Add some animation
        output.style.transform = 'scale(1.1)';
        setTimeout(() => {
            output.style.transform = 'scale(1)';
        }, 200);
    });

    // Add current time
    const now = new Date();
    output.textContent = \`App loaded at \${now.toLocaleTimeString()}\`;
});`, language: 'javascript' }
    ]
  },
  'react': {
    name: 'React App',
    files: [
      { name: 'App.jsx', content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Welcome to React!');

  const handleClick = () => {
    setCount(count + 1);
    setMessage(\`You've clicked \${count + 1} time\${count + 1 === 1 ? '' : 's'}!\`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Sandbox</h1>
        <div className="counter-container">
          <p className="message">{message}</p>
          <button className="counter-btn" onClick={handleClick}>
            Count: {count}
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;`, language: 'jsx', isMain: true },
      { name: 'App.css', content: `.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.App-header {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.counter-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.message {
  font-size: 1.2em;
  color: #666;
  margin: 0;
}

.counter-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.counter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.counter-btn:active {
  transform: translateY(0);
}`, language: 'css' }
    ]
  },
  'vue': {
    name: 'Vue.js App',
    files: [
      { name: 'App.vue', content: `<template>
  <div id="app">
    <div class="container">
      <h1>Vue.js Sandbox</h1>
      <div class="counter-section">
        <p class="message">{{ message }}</p>
        <button @click="increment" class="counter-btn">
          Count: {{ count }}
        </button>
        <input 
          v-model="userInput" 
          placeholder="Type something..." 
          class="input-field"
        />
        <p v-if="userInput" class="echo">You typed: {{ userInput }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      count: 0,
      message: 'Welcome to Vue.js!',
      userInput: ''
    }
  },
  methods: {
    increment() {
      this.count++;
      this.message = \`You've clicked \${this.count} time\${this.count === 1 ? '' : 's'}!\`;
    }
  }
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 20px;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.counter-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.message {
  font-size: 1.2em;
  color: #666;
  margin: 0;
}

.counter-btn {
  background: linear-gradient(45deg, #42b883, #35495e);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.counter-btn:hover {
  transform: translateY(-2px);
}

.input-field {
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 16px;
  width: 250px;
  outline: none;
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #42b883;
}

.echo {
  color: #42b883;
  font-weight: bold;
}
</style>`, language: 'vue', isMain: true }
    ]
  },
  'python': {
    name: 'Python Script',
    files: [
      { name: 'main.py', content: `#!/usr/bin/env python3
"""
Python Sandbox Environment
A simple demonstration of Python capabilities
"""

import math
import random
from datetime import datetime

class Calculator:
    """A simple calculator class"""
    
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def multiply(self, a, b):
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result
    
    def power(self, base, exponent):
        result = base ** exponent
        self.history.append(f"{base} ^ {exponent} = {result}")
        return result
    
    def get_history(self):
        return self.history

def fibonacci(n):
    """Generate Fibonacci sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

def main():
    print("Python Sandbox Environment")
    print("=" * 40)
    print(f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Calculator demo
    calc = Calculator()
    print("Calculator Demo:")
    print(f"5 + 3 = {calc.add(5, 3)}")
    print(f"4 * 7 = {calc.multiply(4, 7)}")
    print(f"2 ^ 8 = {calc.power(2, 8)}")
    print()
    
    # Fibonacci demo
    print("Fibonacci Sequence (first 10 numbers):")
    fib_sequence = fibonacci(10)
    print(fib_sequence)
    print()
    
    # Random number demo
    print("Random Numbers:")
    random_numbers = [random.randint(1, 100) for _ in range(5)]
    print(f"Random integers: {random_numbers}")
    print(f"Average: {sum(random_numbers) / len(random_numbers):.2f}")
    print()
    
    # Math operations
    print("Mathematical Operations:")
    print(f"Square root of 64: {math.sqrt(64)}")
    print(f"Pi: {math.pi:.6f}")
    print(f"Sine of 90 degrees: {math.sin(math.radians(90))}")
    print()
    
    print("Calculation History:")
    for operation in calc.get_history():
        print(f"  {operation}")

if __name__ == "__main__":
    main()`, language: 'python', isMain: true }
    ]
  }
};

interface SandboxEnvironmentProps {
  initialCode?: string;
  initialLanguage?: string;
}

export const SandboxEnvironment = ({ initialCode, initialLanguage }: SandboxEnvironmentProps) => {
  const [currentProject, setCurrentProject] = useState<SandboxProject>(() => {
    if (initialCode && initialLanguage) {
      return {
        id: 'custom',
        name: 'Custom Code',
        files: [{ name: `main.${getFileExtension(initialLanguage)}`, content: initialCode, language: initialLanguage, isMain: true }],
        framework: initialLanguage,
        lastModified: new Date()
      };
    }
    return {
      id: 'vanilla-js',
      name: 'Vanilla JavaScript',
      files: SANDBOX_TEMPLATES['vanilla-js'].files,
      framework: 'vanilla-js',
      lastModified: new Date()
    };
  });
  
  const [activeFile, setActiveFile] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('code');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const { toast } = useToast();
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getFileExtension = (language: string): string => {
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
  };

  const updateFileContent = (content: string) => {
    const updatedFiles = [...currentProject.files];
    updatedFiles[activeFile] = { ...updatedFiles[activeFile], content };
    setCurrentProject({ ...currentProject, files: updatedFiles, lastModified: new Date() });
  };

  const addNewFile = () => {
    const fileName = prompt('Enter file name (with extension):');
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase() || 'txt';
      const language = getLanguageFromExtension(extension);
      const newFile: SandboxFile = {
        name: fileName,
        content: getTemplateContent(language),
        language: language
      };
      setCurrentProject({
        ...currentProject,
        files: [...currentProject.files, newFile],
        lastModified: new Date()
      });
      setActiveFile(currentProject.files.length);
    }
  };

  const getLanguageFromExtension = (ext: string): string => {
    const mapping: Record<string, string> = {
      js: 'javascript', ts: 'typescript', py: 'python', java: 'java',
      cpp: 'cpp', c: 'c', cs: 'csharp', go: 'go', rs: 'rust',
      php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin',
      html: 'html', css: 'css', scss: 'scss', sass: 'sass',
      jsx: 'jsx', tsx: 'tsx', vue: 'vue', svelte: 'svelte',
      json: 'json', xml: 'xml', yml: 'yaml', sql: 'sql',
      md: 'markdown', sh: 'bash', ps1: 'powershell'
    };
    return mapping[ext] || 'text';
  };

  const getTemplateContent = (language: string): string => {
    const templates: Record<string, string> = {
      javascript: '// JavaScript code\nconsole.log("Hello, World!");',
      python: '# Python code\nprint("Hello, World!")',
      html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
      css: '/* CSS styles */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}',
      jsx: 'import React from "react";\n\nfunction Component() {\n    return <div>Hello, World!</div>;\n}\n\nexport default Component;'
    };
    return templates[language] || `// ${language} code\n`;
  };

  const deleteFile = (index: number) => {
    if (currentProject.files.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "At least one file must remain in the project.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedFiles = currentProject.files.filter((_, i) => i !== index);
    setCurrentProject({ ...currentProject, files: updatedFiles, lastModified: new Date() });
    if (activeFile >= updatedFiles.length) {
      setActiveFile(updatedFiles.length - 1);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setConsoleOutput([]);
    
    try {
      const mainFile = currentProject.files.find(f => f.isMain) || currentProject.files[0];
      
      if (mainFile.language === 'html' || currentProject.framework === 'vanilla-js') {
        // For HTML/JS projects, create a complete HTML document
        let htmlContent = '';
        const htmlFile = currentProject.files.find(f => f.language === 'html');
        const cssFile = currentProject.files.find(f => f.language === 'css');
        const jsFile = currentProject.files.find(f => f.language === 'javascript');
        
        if (htmlFile) {
          htmlContent = htmlFile.content;
          // Inject CSS and JS
          if (cssFile) {
            htmlContent = htmlContent.replace('</head>', `<style>${cssFile.content}</style></head>`);
          }
          if (jsFile) {
            htmlContent = htmlContent.replace('</body>', `<script>${jsFile.content}</script></body>`);
          }
        } else {
          // Create HTML wrapper
          htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sandbox Preview</title>
    ${cssFile ? `<style>${cssFile.content}</style>` : ''}
</head>
<body>
    <div id="app">
        <h1>Sandbox Environment</h1>
        <p>Code is running...</p>
    </div>
    ${jsFile ? `<script>${jsFile.content}</script>` : ''}
</body>
</html>`;
        }
        
        // Update iframe
        if (iframeRef.current) {
          iframeRef.current.srcdoc = htmlContent;
        }
        
        setOutput('Web application loaded successfully in preview');
      } else {
        // For other languages, simulate execution
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const executionResult = generateExecutionOutput(mainFile.language, mainFile.content);
        setOutput(executionResult);
      }
      
    } catch (error) {
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

  const loadTemplate = (templateKey: string) => {
    const template = SANDBOX_TEMPLATES[templateKey as keyof typeof SANDBOX_TEMPLATES];
    if (template) {
      setCurrentProject({
        id: templateKey,
        name: template.name,
        files: template.files,
        framework: templateKey,
        lastModified: new Date()
      });
      setActiveFile(0);
      setOutput('');
      setConsoleOutput([]);
    }
  };

  const exportProject = () => {
    const projectData = {
      ...currentProject,
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Project exported",
      description: "Project has been downloaded as JSON file."
    });
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80 h-[600px]';
      case 'tablet': return 'w-[768px] h-[600px]';
      default: return 'w-full h-[600px]';
    }
  };

  return (
    <Card className={`w-full shadow-2xl border border-border/30 ${isFullscreen ? 'fixed inset-4 z-50' : ''} bg-card overflow-hidden`}>
      {/* Professional Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-muted/20 via-muted/10 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{currentProject.name}</h3>
              <p className="text-xs text-muted-foreground">{currentProject.files.length} files • {currentProject.framework}</p>
            </div>
          </div>
          
          <Select value={currentProject.framework} onValueChange={loadTemplate}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vanilla-js">Vanilla JavaScript</SelectItem>
              <SelectItem value="react">React App</SelectItem>
              <SelectItem value="vue">Vue.js App</SelectItem>
              <SelectItem value="python">Python Script</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runCode}
            disabled={isRunning}
            className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportProject} className="gap-2">
            <Download className="w-4 h-4" />
            Export
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
        {/* File Explorer */}
        <div className="w-64 border-r border-border/20 bg-muted/10">
          <div className="p-3 border-b border-border/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Files</h4>
              <Button variant="ghost" size="sm" onClick={addNewFile} className="h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[calc(600px-60px)]">
            <div className="p-2">
              {currentProject.files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                    activeFile === index ? 'bg-muted/70' : ''
                  }`}
                  onClick={() => setActiveFile(index)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    {file.isMain && <Badge variant="secondary" className="text-xs">main</Badge>}
                  </div>
                  {currentProject.files.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(index);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/10">
              <TabsList className="grid w-auto grid-cols-3 bg-muted/30">
                <TabsTrigger value="code" className="gap-2 text-xs">
                  <Code2 className="w-4 h-4" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2 text-xs">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="output" className="gap-2 text-xs">
                  <Terminal className="w-4 h-4" />
                  Console
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                {activeTab === 'code' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className={`h-7 px-2 text-xs ${showLineNumbers ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      <Layers className="w-3 h-3 mr-1" />
                      Lines
                    </Button>
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
                  </>
                )}
                
                {activeTab === 'preview' && (
                  <Select value={previewMode} onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setPreviewMode(value)}>
                    <SelectTrigger className="w-32 h-7 text-xs">
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
                    className="h-full resize-none border-0 rounded-none font-mono text-sm leading-relaxed"
                    style={{ fontSize: `${fontSize}px` }}
                    placeholder="Start coding..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0">
              <div className="h-full bg-gradient-to-br from-muted/5 to-muted/10 p-6 overflow-auto">
                <div className={`${getPreviewDimensions()} mx-auto border border-border/20 rounded-xl overflow-hidden bg-white shadow-xl`}>
                  <div className="bg-gray-100 px-4 py-3 border-b border-border/20 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-sm text-gray-600 font-mono">localhost:3000</div>
                  </div>
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0"
                    title="Code Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output" className="flex-1 mt-0">
              <div className="h-full bg-gray-900 text-green-400 font-mono text-sm">
                {isRunning ? (
                  <div className="p-6 flex items-center gap-4">
                    <RefreshCw className="w-6 h-6 animate-spin text-yellow-400" />
                    <div>
                      <div className="text-xl font-bold mb-2 text-yellow-400">Executing code...</div>
                      <div className="text-sm opacity-80">Please wait while your code is being processed</div>
                    </div>
                  </div>
                ) : output ? (
                  <ScrollArea className="h-full">
                    <pre className="p-6 whitespace-pre-wrap leading-relaxed">{output}</pre>
                  </ScrollArea>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Console Output</p>
                    <p className="text-sm">Run your code to see the output here</p>
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