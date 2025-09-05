class PuterService {
  private initialized: boolean = false;
  private testModels: string[] = [
    "gpt-5-2025-08-07", "gpt-5", "gpt-5-mini-2025-08-07", "gpt-5-mini", "gpt-5-nano-2025-08-07", "gpt-5-nano", "gpt-5-chat-latest",
    "gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o1-pro", "o3", "o3-mini", "o4-mini",
    "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4.5-preview",
    "claude-opus-4-1-20250805", "claude-opus-4-1", "claude-opus-4-20250514", "claude-opus-4", "claude-opus-4-latest",
    "claude-sonnet-4-20250514", "claude-sonnet-4", "claude-sonnet-4-latest",
    "claude-3-7-sonnet-20250219", "claude-3-7-sonnet-latest", "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20240620", "claude-3-haiku-20240307",
    "deepseek-ai/DeepSeek-R1", "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", "deepseek-ai/DeepSeek-V3.1", "deepseek-ai/DeepSeek-V3",
    "deepseek-chat", "deepseek-reasoner",
    "gemini-1.5-flash", "gemini-2.0-flash", "google/gemma-3-27b-it", "google/gemma-3n-E4B-it",
    "mistral-large-latest", "mistral-medium-latest", "ministral-3b-latest", "ministral-8b-latest",
    "codestral-latest", "pixtral-large-latest",
    "grok-beta", "grok-vision-beta", "grok-3", "grok-3-fast", "grok-3-mini", "grok-2",
    "meta-llama/Llama-3.3-70B-Instruct-Turbo", "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "Qwen/Qwen3-235B-A22B-Instruct-2507-tput", "Qwen/Qwen2.5-72B-Instruct-Turbo", "Qwen/QwQ-32B",
    "openrouter:deepcogito/cogito-v2-preview-llama-109b-moe", "openrouter:x-ai/grok-4",
    "openrouter:anthropic/claude-opus-4.1", "openrouter:openai/gpt-5", "openrouter:openai/o3-pro",
    "openrouter:google/gemini-2.5-pro", "openrouter:mistralai/magistral-medium-2506",
    "openrouter:deepseek/deepseek-r1", "openrouter:qwen/qwen3-235b-a22b"
  ];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('Initializing Puter SDK...');
      
      // Check if Puter SDK is available
      if (typeof window !== 'undefined' && (window as any).puter) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.initialized = true;
        console.log('Puter SDK initialized successfully.');
      } else {
        console.warn('Puter SDK not available, using fallback mode.');
        this.initialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Puter SDK:', error);
      this.initialized = true; // Continue with fallback
    }
  }

  getAvailableModels(): string[] {
    return this.testModels;
  }

  getModelDisplayName(modelId: string): string {
    // Handle OpenRouter models
    if (modelId.startsWith('openrouter:')) {
      const cleanId = modelId.replace('openrouter:', '');
      const parts = cleanId.split('/');
      if (parts.length === 2) {
        const [provider, model] = parts;
        return `${model} (${provider})`;
      }
      return cleanId;
    }

    // Handle provider/model format
    if (modelId.includes('/')) {
      const parts = modelId.split('/');
      if (parts.length === 2) {
        const [provider, model] = parts;
        return `${model} (${provider})`;
      }
    }

    // Special cases for known models
    const displayNames: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'o1': 'o1',
      'o1-mini': 'o1 Mini',
      'o1-pro': 'o1 Pro',
      'o3': 'o3',
      'o3-mini': 'o3 Mini',
      'gpt-5': 'GPT-5',
      'gpt-5-mini': 'GPT-5 Mini',
      'claude-opus-4': 'Claude 4 Opus',
      'claude-sonnet-4': 'Claude 4 Sonnet',
      'claude-3-5-sonnet-latest': 'Claude 3.5 Sonnet',
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-reasoner': 'DeepSeek Reasoner',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'grok-3': 'Grok-3',
      'grok-beta': 'Grok Beta'
    };

    return displayNames[modelId] || modelId;
  }

  getModelsByCategory(): Record<string, Array<{ 
    id: string; 
    name: string; 
    provider: string; 
    status: string; 
    category: string; 
    streaming?: boolean 
  }>> {
    const categories: Record<string, Array<{ 
      id: string; 
      name: string; 
      provider: string; 
      status: string; 
      category: string; 
      streaming?: boolean 
    }>> = {
      'Featured': [],
      'OpenAI': [],
      'Anthropic': [],
      'Google': [],
      'DeepSeek': [],
      'Meta': [],
      'Mistral': [],
      'xAI': [],
      'Qwen': [],
      'OpenRouter': [],
      'Other': []
    };

    this.testModels.forEach(modelId => {
      const model = {
        id: modelId,
        name: this.getModelDisplayName(modelId),
        provider: this.getModelProvider(modelId),
        status: 'live',
        category: this.getModelCategory(modelId),
        streaming: this.isStreamingSupported(modelId)
      };

      // Add to featured if it's a popular model
      if (this.isFeaturedModel(modelId)) {
        categories['Featured'].push(model);
      }

      // Add to appropriate category
      const category = this.getModelCategory(modelId);
      if (categories[category]) {
        categories[category].push(model);
      } else {
        categories['Other'].push(model);
      }
    });

    return categories;
  }

  private getModelProvider(modelId: string): string {
    if (modelId.startsWith('openrouter:')) {
      const cleanId = modelId.replace('openrouter:', '');
      const parts = cleanId.split('/');
      return parts.length === 2 ? parts[0] : 'OpenRouter';
    }

    if (modelId.includes('/')) {
      const parts = modelId.split('/');
      return parts[0];
    }

    if (modelId.startsWith('gpt-') || modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
      return 'OpenAI';
    }
    if (modelId.startsWith('claude-')) return 'Anthropic';
    if (modelId.startsWith('gemini-') || modelId.startsWith('google/')) return 'Google';
    if (modelId.startsWith('deepseek-') || modelId.includes('DeepSeek')) return 'DeepSeek';
    if (modelId.startsWith('grok-')) return 'xAI';
    if (modelId.startsWith('mistral-') || modelId.startsWith('ministral-') || modelId.startsWith('codestral-') || modelId.startsWith('pixtral-')) return 'Mistral';
    if (modelId.includes('llama') || modelId.includes('Llama')) return 'Meta';
    if (modelId.startsWith('Qwen/') || modelId.includes('Qwen')) return 'Qwen';

    return 'Unknown';
  }

  private getModelCategory(modelId: string): string {
    if (modelId.startsWith('openrouter:')) return 'OpenRouter';
    
    const provider = this.getModelProvider(modelId);
    if (['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Meta', 'Mistral', 'xAI', 'Qwen'].includes(provider)) {
      return provider;
    }
    
    return 'Other';
  }

  private isFeaturedModel(modelId: string): boolean {
    const featured = [
      'gpt-4o', 'gpt-5', 'o1', 'o3',
      'claude-opus-4', 'claude-sonnet-4', 'claude-3-5-sonnet-latest',
      'gemini-2.0-flash', 'deepseek-chat', 'deepseek-reasoner',
      'grok-3', 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
    ];
    return featured.includes(modelId);
  }

  isStreamingSupported(modelId: string): boolean {
    // Most modern models support streaming
    const nonStreamingModels = [
      'o1', 'o1-mini', 'o1-pro', 'o3', 'o3-mini', 'o4-mini'
    ];
    
    return !nonStreamingModels.includes(modelId);
  }

  async chat(
    message: string, 
    options?: { model?: string; stream?: boolean; temperature?: number; maxTokens?: number }, 
    sessionId?: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    await this.initialize();

    const modelId = options?.model || 'gpt-4o';
    const shouldStream = options?.stream && this.isStreamingSupported(modelId) && onStream;

    try {
      // Try Puter SDK first
      if (typeof window !== 'undefined' && (window as any).puter?.ai?.chat) {
        const puterOptions = {
          model: modelId,
          stream: shouldStream,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000
        };

        if (shouldStream && onStream) {
          let fullResponse = '';
          const response = await (window as any).puter.ai.chat(message, puterOptions);
          
          if (response && typeof response === 'object' && response.stream) {
            for await (const chunk of response.stream) {
              if (chunk.choices?.[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;
                fullResponse += content;
                onStream(content);
              }
            }
            return fullResponse;
          }
        }

        const response = await (window as any).puter.ai.chat(message, puterOptions);
        return this.extractResponseText(response);
      }

      // Fallback response
      const fallbackResponse = `I'm a simulated AI assistant. You asked: "${message}"\n\nThis is a fallback response since the Puter SDK is not available. The selected model was: ${modelId}`;
      
      if (shouldStream && onStream) {
        for (let i = 0; i < fallbackResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          onStream(fallbackResponse[i]);
        }
      }
      
      return fallbackResponse;

    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = `I apologize, but I encountered an error while processing your request. Please try again or select a different model.`;
      
      if (shouldStream && onStream) {
        for (let i = 0; i < errorResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          onStream(errorResponse[i]);
        }
      }
      
      return errorResponse;
    }
  }

  private extractResponseText(response: any): string {
    if (typeof response === 'string') {
      return response;
    }

    if (response?.choices?.[0]?.message?.content) {
      return response.choices[0].message.content;
    }

    if (response?.choices?.[0]?.text) {
      return response.choices[0].text;
    }

    if (response?.content) {
      return response.content;
    }

    if (response?.text) {
      return response.text;
    }

    if (response?.message) {
      return response.message;
    }

    return 'I received your message but couldn\'t generate a proper response. Please try again.';
  }
}

export const puterService = new PuterService();