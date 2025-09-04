import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, Eye, Download, Maximize2, Code2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  model?: string;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

const modelDisplayNames: Record<string, string> = {
  // GPT-5 Series
  'gpt-5': 'GPT-5',
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-5-nano': 'GPT-5 Nano',
  'gpt-5-chat-latest': 'GPT-5 Chat',
  
  // GPT-4 Series
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 Mini',
  'gpt-4.1-nano': 'GPT-4.1 Nano',
  
  // o1 Series
  'o1': 'o1',
  'o1-pro': 'o1 Pro',
  'o1-mini': 'o1 Mini',
  'o3': 'o3',
  'o3-mini': 'o3 Mini',
  'o4-mini': 'o4 Mini',
  
  // Claude 4 Series
  'claude-opus-4': 'Claude 4 Opus',
  'claude-opus-4-1': 'Claude 4.1 Opus',
  'claude-sonnet-4': 'Claude 4 Sonnet',
  'claude-3-7-sonnet-latest': 'Claude 3.7 Sonnet',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  
  // DeepSeek Models
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  'deepseek-ai/DeepSeek-R1': 'DeepSeek R1',
  'deepseek-ai/DeepSeek-V3.1': 'DeepSeek V3.1',
  'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
  
  // Grok Models
  'grok-3': 'Grok-3',
  'grok-3-mini': 'Grok-3 Mini',
  'grok-2': 'Grok-2',
  'grok-beta': 'Grok Beta',
  
  // Gemini Models
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  
  // Meta Models
  'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': 'Llama 3.1 405B',
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': 'Llama 3.3 70B',
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': 'Llama 3.1 70B',
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': 'Llama 3.1 8B',
  
  // Mistral Models
  'mistral-large-latest': 'Mistral Large',
  'codestral-latest': 'Codestral',
  'pixtral-large-latest': 'Pixtral Large',
  
  // Qwen Models
  'Qwen/Qwen3-235B-A22B-Instruct-2507-tput': 'Qwen 3 235B',
  'Qwen/QwQ-32B': 'QwQ 32B',
  'Qwen/Qwen2.5-72B-Instruct-Turbo': 'Qwen 2.5 72B',
  
  // Specialized Models
  'cartesia/sonic': 'Cartesia Sonic',
  'togethercomputer/MoA-1': 'Mixture of Agents',
  'moonshotai/Kimi-K2-Instruct': 'Kimi K2'
};

export const ChatMessage = ({ message, isUser, timestamp, model, isStreaming, onRegenerate, showRegenerate }: ChatMessageProps) => {
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
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-4 sm:ml-8 md:ml-16 shadow-lg" 
          : "bg-[#FFFAFA]/5 text-[#FFFAFA] mr-4 sm:mr-8 md:mr-16 border border-[#FFFAFA]/20 backdrop-blur-sm"
      )}>
        {isUser ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {safeMessage}
          </div>
        ) : (
          <div>
            {model && model !== 'system' && model !== 'error' && (
              <div className="text-xs text-[#FFFAFA]/60 mb-2 opacity-80 font-medium flex items-center gap-2">
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
                                  <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded">
                                    Preview Available
                                  </span>
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
            isUser ? "text-right text-blue-100" : "text-left text-[#FFFAFA]/50"
          )}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {showRegenerate && onRegenerate && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="text-xs text-[#FFFAFA]/60 hover:text-[#FFFAFA] hover:bg-[#FFFAFA]/10"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};