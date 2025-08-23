import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, Eye, Download, Maximize2, Code2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  model?: string;
  isStreaming?: boolean;
}

const modelDisplayNames: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'deepseek-r1': 'DeepSeek R1',
  'deepseek-v3': 'DeepSeek V3',
  'llama-3.1-405b': 'Llama 3.1 405B',
  'llama-3.1-70b': 'Llama 3.1 70B',
  'llama-3.1-8b': 'Llama 3.1 8B'
};

export const ChatMessage = ({ message, isUser, timestamp, model, isStreaming }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { theme } = useTheme();
  
  const safeMessage = typeof message === 'string' ? message : String(message || 'Invalid message format');

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={cn(
      "flex w-full animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm",
        isUser 
          ? "bg-blue-600 text-white ml-4 sm:ml-8 md:ml-16" 
          : "bg-muted/50 text-foreground mr-4 sm:mr-8 md:mr-16 border border-border/20"
      )}>
        {isUser ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {safeMessage}
          </div>
        ) : (
          <div>
            {model && model !== 'system' && model !== 'error' && (
              <div className="text-xs text-muted-foreground mb-2 opacity-80 font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {modelDisplayNames[model] || model}
              </div>
            )}
            <div className={cn("prose prose-sm max-w-none", isStreaming && 'animate-pulse')}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 break-words leading-relaxed">{children}</p>,
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const isInline = !className || !language;
                    const codeContent = String(children).replace(/\n$/, '');
                    
                    if (!isInline && language && codeContent.length > 50) {
                      // Enhanced code block with sandbox integration
                      const isWebCode = ['html', 'css', 'javascript', 'jsx', 'tsx', 'vue', 'svelte'].includes(language);
                      
                      return (
                        <div className="my-4">
                          <div className="relative group rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                            <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b border-border/20">
                              <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
                                {isWebCode && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                                    Preview Available
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(codeContent)}
                                  className="h-6 w-6 p-0 hover:bg-muted/50"
                                  title="Copy code"
                                >
                                  {copiedCode === codeContent ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                                {isWebCode && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Trigger sandbox opening
                                      const event = new CustomEvent('openSandbox', {
                                        detail: { code: codeContent, language }
                                      });
                                      window.dispatchEvent(event);
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-muted/50"
                                    title="Open in sandbox"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <SyntaxHighlighter
                              style={theme === 'dark' ? oneDark : oneLight}
                              language={language}
                              PreTag="div"
                              className="!mt-0 !mb-0 text-sm"
                              customStyle={{
                                margin: 0,
                                padding: '12px 16px',
                                background: 'transparent',
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}
                            >
                              {codeContent}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      );
                    } else if (!isInline && language) {
                      // Use syntax highlighter for shorter code blocks
                      return (
                        <div className="relative group my-3 rounded-lg overflow-hidden border border-border/20">
                          <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b border-border/20">
                            <div className="flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(codeContent)}
                                className="h-6 w-6 p-0 hover:bg-muted/50"
                                title="Copy code"
                              >
                                {copiedCode === codeContent ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <SyntaxHighlighter
                            style={theme === 'dark' ? oneDark : oneLight}
                            language={language}
                            PreTag="div"
                            className="!mt-0 !mb-0 text-sm"
                            customStyle={{
                              margin: 0,
                              padding: '12px 16px',
                              background: 'transparent',
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    
                    return (
                      <code className="bg-muted/50 px-2 py-1 rounded text-sm font-mono break-all border border-border/20" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <div className="my-3 overflow-x-auto">{children}</div>,
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 pl-4">{children}</ol>,
                  li: ({ children }) => <li className="break-words leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 break-words border-b border-border/20 pb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-3 break-words">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2 break-words">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500/30 pl-4 italic my-3 break-words bg-muted/20 py-2 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="min-w-full border border-border/20 rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border/20 px-3 py-2 bg-muted/30 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border/20 px-3 py-2">
                      {children}
                    </td>
                  ),
                }}
              >
                {safeMessage}
              </ReactMarkdown>
            </div>
          </div>
        )}
        {timestamp && (
          <div className={cn(
            "text-xs mt-2 opacity-60",
            isUser ? "text-right text-blue-100" : "text-left text-muted-foreground"
          )}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};