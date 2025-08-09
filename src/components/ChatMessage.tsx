import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodePreview } from "./CodePreview";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  model?: string;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isUser, timestamp, model, isStreaming }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Ensure message is always a string for ReactMarkdown
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
      "flex w-full animate-slide-up",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-message",
        isUser 
          ? "bg-user-message text-user-message-foreground ml-8 sm:ml-12" 
          : "bg-ai-message text-ai-message-foreground mr-8 sm:mr-12"
      )}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{safeMessage}</p>
        ) : (
          <div className="bg-ai-message text-ai-message-foreground">
            {model && model !== 'system' && model !== 'error' && (
              <div className="text-xs text-muted-foreground mb-2 opacity-70">
                {model}
              </div>
            )}
            <div className={isStreaming ? 'animate-pulse' : ''}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const isInline = !className || !language;
                    const codeContent = String(children).replace(/\n$/, '');
                    
                    if (!isInline && language && codeContent.length > 50) {
                      // Use advanced CodePreview for longer code blocks
                      const isExecutable = ['javascript', 'html', 'css', 'jsx', 'tsx'].includes(language);
                      
                      return (
                        <div className="my-4">
                          <CodePreview
                            code={codeContent}
                            language={language}
                            title={`${language.toUpperCase()} Code`}
                            isExecutable={isExecutable}
                          />
                        </div>
                      );
                    } else if (!isInline && language) {
                      // Use simple syntax highlighter for shorter code blocks
                      return (
                        <div className="relative group my-2">
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(codeContent)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0 bg-muted/80 hover:bg-muted text-muted-foreground"
                              title="Copy code"
                            >
                              {copiedCode === codeContent ? (
                                <Check className="w-2 h-2 sm:w-3 sm:h-3" />
                              ) : (
                                <Copy className="w-2 h-2 sm:w-3 sm:h-3" />
                              )}
                            </Button>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={language}
                            PreTag="div"
                            className="rounded-md !mt-2 !mb-2 text-xs sm:text-sm"
                            customStyle={{
                              fontSize: window.innerWidth < 640 ? '12px' : '14px',
                              lineHeight: '1.5',
                              padding: window.innerWidth < 640 ? '8px' : '12px'
                            }}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    
                    return (
                      <code className="bg-muted px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-mono break-all" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <div className="my-2 overflow-x-auto">{children}</div>,
                  // Handle long text and links
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline break-all"
                    >
                      {children}
                    </a>
                  ),
                  // Handle lists
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="break-words">{children}</li>,
                  // Handle headings
                  h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-2 break-words">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold mb-2 break-words">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold mb-2 break-words">{children}</h3>,
                  // Handle blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2 break-words">
                      {children}
                    </blockquote>
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
            "text-xs mt-1 opacity-60",
            isUser ? "text-right" : "text-left"
          )}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};