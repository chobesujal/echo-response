export const TypingIndicator = () => {
  return (
    <div className="flex justify-start w-full animate-slide-up">
      <div className="bg-ai-message text-ai-message-foreground px-4 py-3 rounded-2xl shadow-message mr-12">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};