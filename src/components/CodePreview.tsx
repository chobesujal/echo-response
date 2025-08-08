import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Play, Download, Eye, Code, Maximize2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface CodePreviewProps {
  code: string;
  language: string;
  title?: string;
  description?: string;
  isExecutable?: boolean;
}

export const CodePreview = ({ 
  code, 
  language, 
  title = "Code Preview", 
  description,
  isExecutable = false 
}: CodePreviewProps) => {
  const [activeTab, setActiveTab] = useState("code");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied",
        description: "Code has been copied to clipboard."
      });
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const runCode = async () => {
    if (!isExecutable) return;
    
    setIsRunning(true);
    setActiveTab("output");
    
    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (language === 'javascript') {
        setOutput(`// Executing JavaScript code...\n\n${code}\n\n// Output:\nCode executed successfully!`);
      } else if (language === 'html') {
        setOutput(`<!-- HTML Preview -->\n${code}`);
      } else {
        setOutput(`Code execution completed for ${language}.\nThis is a simulated output.`);
      }
    } catch (error) {
      setOutput(`Error executing code: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Code downloaded",
      description: `File saved as code.${getFileExtension(language)}`
    });
  };

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      jsx: 'jsx',
      tsx: 'tsx'
    };
    return extensions[lang] || 'txt';
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-500',
      python: 'bg-green-500',
      html: 'bg-orange-500',
      css: 'bg-purple-500',
      json: 'bg-gray-500',
      jsx: 'bg-cyan-500',
      tsx: 'bg-indigo-500',
      markdown: 'bg-slate-500',
      md: 'bg-slate-500'
    };
    return colors[lang] || 'bg-gray-500';
  };

  return (
    <Card className="w-full shadow-card border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Badge className={`${getLanguageColor(language)} text-white`}>
            {language.toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {isExecutable && (
            <Button
              variant="outline"
              size="sm"
              onClick={runCode}
              disabled={isRunning}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCode}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Expand
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="code" className="gap-2">
            <Code className="w-4 h-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="output" className="gap-2" disabled={!isExecutable}>
            <Play className="w-4 h-4" />
            Output
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-0">
          <ScrollArea className="h-[400px]">
            <SyntaxHighlighter
              language={language}
              style={oneDark as any}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                background: 'transparent'
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }
              }}
            >
              {code}
            </SyntaxHighlighter>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="h-[400px] bg-background border-t border-border">
            {language === 'html' ? (
              <iframe
                srcDoc={code}
                className="w-full h-full border-0"
                title="HTML Preview"
              />
            ) : language === 'markdown' || language === 'md' ? (
              <ScrollArea className="h-full">
                <div className="p-4 prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{code}</ReactMarkdown>
                </div>
              </ScrollArea>
            ) : language === 'json' ? (
              <ScrollArea className="h-full">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-foreground">
                  {(() => { try { return JSON.stringify(JSON.parse(code), null, 2); } catch { return code; } })()}
                </pre>
              </ScrollArea>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Preview not available for {language} files</p>
                <p className="text-sm">Use the Code tab to view the source</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="output" className="mt-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 font-mono text-sm bg-background border-t border-border">
              {isRunning ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Executing code...
                </div>
              ) : output ? (
                <pre className="whitespace-pre-wrap text-foreground">{output}</pre>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Click "Run" to execute the code</p>
                  <p className="text-sm">Output will appear here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
};