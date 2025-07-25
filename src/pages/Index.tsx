import { ChatContainer } from "@/components/ChatContainer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            AI Chat Assistant
          </h1>
          <p className="text-muted-foreground">
            Start a conversation with your intelligent AI companion
          </p>
        </div>
        <ChatContainer />
      </div>
    </div>
  );
};

export default Index;
