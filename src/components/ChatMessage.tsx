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
        "max-w-[80%] px-4 py-3 rounded-2xl shadow-message",
        isUser 
          ? "bg-user-message text-user-message-foreground ml-12" 
          : "bg-ai-message text-ai-message-foreground mr-12"
      )}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{safeMessage}</p>
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
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
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
                              className="h-8 w-8 p-0 bg-muted/80 hover:bg-muted text-muted-foreground"
                              title="Copy code"
                            >
                              {copiedCode === codeContent ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={language}
                            PreTag="div"
                            className="rounded-md !mt-2 !mb-2"
                            customStyle={{
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
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <div className="my-2">{children}</div>
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