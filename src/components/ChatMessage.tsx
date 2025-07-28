import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
                    
                    if (!isInline && language) {
                      return (
                        <div className="relative group">
                          <button
                            onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                            className="absolute top-2 right-2 bg-muted hover:bg-muted/80 text-muted-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={language}
                            PreTag="div"
                            className="rounded-md !mt-2 !mb-2"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    
                    return (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
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