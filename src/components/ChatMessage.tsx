import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export const ChatMessage = ({ message, isUser, timestamp }: ChatMessageProps) => {
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
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown 
              components={{
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({children}) => <code className="bg-accent px-1 py-0.5 rounded text-xs">{children}</code>,
                pre: ({children}) => <pre className="bg-accent p-3 rounded-lg overflow-x-auto">{children}</pre>
              }}
            >
              {message}
            </ReactMarkdown>
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