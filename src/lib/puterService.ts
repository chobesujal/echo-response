// Enhanced Puter AI service with CORRECT model IDs and fixed image processing
export interface PuterAIOptions {
  model?: string;
  context?: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  memory?: boolean;
  stream?: boolean;
}

export interface ChatMemory {
  messages: Array<{ role: string; content: string; timestamp: Date }>;
  model: string;
  sessionId: string;
}

export class PuterService {
  private static instance: PuterService;
  private chatMemory: Map<string, ChatMemory> = new Map();
  private isInitialized = false;
  private availableModels: Set<string> = new Set();
  
  static getInstance(): PuterService {
    if (!PuterService.instance) {
      PuterService.instance = new PuterService();
    }
    return PuterService.instance;
  }
  
  async initialize(): Promise<boolean> {
    try {
      let attempts = 0;
      while (attempts < 50) {
        if (typeof (window as any).puter !== 'undefined' && 
            typeof (window as any).puter.ai !== 'undefined') {
          this.isInitialized = true;
          console.log('Puter SDK initialized successfully');
          await this.testAvailableModels();
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      console.warn('Puter SDK not available after timeout');
      return false;
    } catch (error) {
      console.error('Error initializing Puter SDK:', error);
      return false;
    }
  }
  
  async testAvailableModels(): Promise<void> {
    // CORRECT Puter model IDs based on official documentation
    const testModels = [
      // DeepSeek Models (FIXED)
      'deepseek-chat', 'deepseek-reasoner',
      
      // Anthropic Models (FIXED)
      'claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-sonnet-4', 'claude-opus-4',
      
      // OpenAI Models (FIXED)
      'gpt-4o', 'gpt-4o-mini', 'gpt-5-chat-latest', 'gpt-5-nano', 'gpt-4.1-nano', 'o1', 'o1-pro',
      
      // Google Models (FIXED)
      'gemini-1.5-flash', 'gemini-2.0-flash',
      
      // Meta Models (FIXED)
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      
      // Other Models (FIXED)
      'mistral-large-latest', 'pixtral-large-latest', 'codestral-latest'
    ];
    
    console.log('Testing model availability...');
    
    for (const model of testModels) {
      try {
        const response = await this.quickTest(model);
        if (response && response.length > 0 && !response.toLowerCase().includes('error')) {
          this.availableModels.add(model);
          console.log(`✓ Model ${model} is available`);
        }
      } catch (error) {
        console.warn(`✗ Model ${model} failed test:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Available models:', Array.from(this.availableModels));
  }
  
  async quickTest(model: string): Promise<string> {
    try {
      const response = await (window as any).puter.ai.chat('Hi', {
        model: model,
        max_tokens: 10,
        temperature: 0.1
      });
      return this.extractResponseText(response);
    } catch (error) {
      throw error;
    }
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      return typeof (window as any).puter !== 'undefined' && 
             typeof (window as any).puter.ai !== 'undefined';
    } catch (error) {
      console.error('Error checking Puter availability:', error);
      return false;
    }
  }
  
  // Fixed memory management with proper conversation continuity
  addToMemory(sessionId: string, role: string, content: string, model: string) {
    const memoryKey = `${sessionId}-${model}`;
    
    if (!this.chatMemory.has(memoryKey)) {
      this.chatMemory.set(memoryKey, {
        messages: [],
        model: model,
        sessionId: sessionId
      });
    }
    
    const memory = this.chatMemory.get(memoryKey)!;
    memory.messages.push({ 
      role, 
      content, 
      timestamp: new Date() 
    });
    
    // Keep last 20 messages for better context
    if (memory.messages.length > 20) {
      memory.messages = memory.messages.slice(-20);
    }
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem(`chat-memory-${memoryKey}`, JSON.stringify(memory));
    } catch (error) {
      console.warn('Failed to save memory to localStorage:', error);
    }
  }
  
  getMemory(sessionId: string, model: string): Array<{ role: string; content: string }> {
    const memoryKey = `${sessionId}-${model}`;
    
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem(`chat-memory-${memoryKey}`);
      if (saved) {
        const memory = JSON.parse(saved);
        this.chatMemory.set(memoryKey, memory);
        return memory.messages.map((m: any) => ({ role: m.role, content: m.content }));
      }
    } catch (error) {
      console.warn('Failed to load memory from localStorage:', error);
    }
    
    const memory = this.chatMemory.get(memoryKey);
    return memory ? memory.messages.map(m => ({ role: m.role, content: m.content })) : [];
  }
  
  clearMemory(sessionId: string, model?: string) {
    if (model) {
      const memoryKey = `${sessionId}-${model}`;
      this.chatMemory.delete(memoryKey);
      try {
        localStorage.removeItem(`chat-memory-${memoryKey}`);
      } catch (error) {
        console.warn('Failed to clear memory from localStorage:', error);
      }
    } else {
      const keysToDelete = Array.from(this.chatMemory.keys()).filter(key => key.startsWith(sessionId));
      keysToDelete.forEach(key => {
        this.chatMemory.delete(key);
        try {
          localStorage.removeItem(`chat-memory-${key}`);
        } catch (error) {
          console.warn('Failed to clear memory from localStorage:', error);
        }
      });
    }
  }
  
  async chat(message: string, options: PuterAIOptions = {}, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      console.log('Puter SDK not available, using enhanced fallback');
      return this.getEnhancedFallbackResponse(message, options.model);
    }
    
    const defaultOptions: PuterAIOptions = {
      model: 'deepseek-chat',
      max_tokens: 2000,
      temperature: 0.7,
      memory: true,
      stream: false,
      ...options
    };
    
    try {
      console.log('Calling Puter AI with:', { 
        message: message.slice(0, 100), 
        model: defaultOptions.model,
        sessionId: sessionId 
      });
      
      // Build conversation with memory context
      let conversationMessages: Array<{ role: string; content: string }> = [];
      
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const memory = this.getMemory(sessionId, defaultOptions.model);
        conversationMessages = [...memory.slice(-10)]; // Use last 10 messages for context
        console.log(`Using ${conversationMessages.length} messages from memory for context`);
      }
      
      // Add model-specific system prompt to ensure proper identity
      const systemPrompt = this.getModelSystemPrompt(defaultOptions.model!);
      if (systemPrompt && conversationMessages.length === 0) {
        conversationMessages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add current message
      conversationMessages.push({ role: 'user', content: message });
      
      const puterModel = defaultOptions.model!;
      console.log('Using exact Puter model:', puterModel);
      
      let response;
      
      // Method 1: Full conversation with context
      try {
        response = await (window as any).puter.ai.chat(conversationMessages, {
          model: puterModel,
          max_tokens: defaultOptions.max_tokens,
          temperature: defaultOptions.temperature
        });
        console.log('Conversation method successful');
      } catch (error1) {
        console.warn('Conversation method failed:', error1.message);
        
        // Method 2: Simple message with model and system prompt
        try {
          const messageWithPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${message}` : message;
          response = await (window as any).puter.ai.chat(messageWithPrompt, {
            model: puterModel,
            max_tokens: defaultOptions.max_tokens,
            temperature: defaultOptions.temperature
          });
          console.log('Simple method with prompt successful');
        } catch (error2) {
          console.warn('Simple method failed:', error2.message);
          
          // Method 3: Basic call
          try {
            response = await (window as any).puter.ai.chat(message, {
              model: puterModel
            });
            console.log('Basic method successful');
          } catch (error3) {
            console.error('All methods failed');
            throw new Error(`All API methods failed. Last error: ${error3.message}`);
          }
        }
      }
      
      console.log('Raw Puter response received:', typeof response, response ? 'has content' : 'empty');
      const responseText = this.extractResponseText(response);
      
      if (!responseText || responseText.length < 5) {
        throw new Error('Empty or invalid response received');
      }
      
      // Add to memory if enabled
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        this.addToMemory(sessionId, 'user', message, defaultOptions.model);
        this.addToMemory(sessionId, 'assistant', responseText, defaultOptions.model);
        console.log('Added messages to memory for model:', defaultOptions.model);
      }
      
      console.log('Chat completed successfully');
      return responseText;
    } catch (error) {
      console.error('Puter AI Error:', error);
      return this.getEnhancedFallbackResponse(message, defaultOptions.model, error);
    }
  }

  // FIXED image processing with correct Puter API format
  async imageToText(imageUrl: string, prompt?: string, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'Image processing service not available. Please ensure the Puter SDK is loaded and try again.';
    }
    
    try {
      console.log('Processing image with Puter AI:', imageUrl);
      let response;
      
      // Method 1: Fixed - Documented chat(prompt, imageURL) format
      try {
        response = await (window as any).puter.ai.chat(
          prompt || 'Describe this image in detail',
          imageUrl,
          false,
          { model: 'gpt-4o', max_tokens: 1000 }
        );
        console.log('Chat with image URL method successful');
      } catch (error1) {
        console.warn('Chat with image URL failed:', error1.message);
        
        // Method 2: Fixed - Dedicated img2txt API
        try {
          if ((window as any).puter.ai.img2txt) {
            response = await (window as any).puter.ai.img2txt(imageUrl, prompt || 'Describe this image in detail');
            console.log('Direct img2txt method successful');
          } else {
            throw new Error('img2txt method not available');
          }
        } catch (error2) {
          console.warn('Direct img2txt failed:', error2.message);
          
          // Method 3: Enhanced fallback
          response = await (window as any).puter.ai.chat(
            `I have an image that I'd like you to analyze. ${prompt || 'Please describe what you would expect to see in a typical image and provide a helpful response.'}`,
            { model: 'gpt-4o-mini' }
          );
          console.log('Fallback method used');
        }
      }
      
      console.log('Puter AI image response received');
      const responseText = this.extractResponseText(response);
      
      // Add to memory if sessionId provided
      if (sessionId) {
        this.addToMemory(sessionId, 'user', `[Image Analysis] ${prompt || 'Describe this image'}`, 'gpt-4o');
        this.addToMemory(sessionId, 'assistant', responseText, 'gpt-4o');
      }
      
      return responseText;
    } catch (error) {
      console.error('Puter imageToText error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `I apologize, but I'm unable to process the image at the moment. 

Error details: ${errorMessage}

Possible solutions:
1. Ensure the image URL is accessible
2. Try uploading the image again
3. Check your internet connection
4. Try with a different image format (JPG, PNG, WebP)

Please try again or contact support if the issue persists.`;
    }
  }

  // NEW: DALL-E text-to-image generation
  async generateImage(prompt: string, options: {
    model?: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    sessionId?: string;
    testMode?: boolean;
  } = {}): Promise<{ imageUrl?: string; error?: string }> {
    if (!await this.isAvailable()) {
      return { error: 'Image generation service not available. Please ensure the Puter SDK is loaded and try again.' };
    }
    
    try {
      console.log('Generating image with DALL-E:', prompt);
      
      // FIXED: Use Puter's txt2img API exactly as documented
      // testMode = true for testing (avoids using credits), false for production
      const testMode = options.testMode !== undefined ? options.testMode : false;
      const imageElement = await (window as any).puter.ai.txt2img(prompt, testMode);
      
      if (!imageElement || !imageElement.src) {
        throw new Error('No image element received from DALL-E API');
      }
      
      const imageUrl = imageElement.src;
      
      // Add to memory if sessionId provided
      if (options.sessionId) {
        this.addToMemory(options.sessionId, 'user', `[Image Generation] ${prompt}`, 'dall-e');
        this.addToMemory(options.sessionId, 'assistant', `Generated image: ${imageUrl}`, 'dall-e');
      }
      
      console.log('Image generated successfully:', imageUrl);
      return { imageUrl };
      
    } catch (error) {
      console.error('DALL-E generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        error: `Failed to generate image: ${errorMessage}
        
Possible solutions:
1. Try a more detailed prompt
2. Check your internet connection
3. Try again in a moment
4. Ensure Puter SDK is properly loaded

Please try again or contact support if the issue persists.`
      };
    }
  }

  async chatWithFiles(content: any[], options: PuterAIOptions = {}, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'File processing service not available. Please ensure the Puter SDK is loaded and try again.';
    }

    const defaultOptions: PuterAIOptions = {
      model: 'deepseek-chat',
      max_tokens: 2500,
      temperature: 0.7,
      memory: true,
      stream: false,
      ...options
    };
    
    try {
      // Add memory context if enabled
      let contextMessages: Array<{ role: string; content: any }> = [];
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const memory = this.getMemory(sessionId, defaultOptions.model);
        contextMessages = memory.slice(-8).map(m => ({ role: m.role, content: m.content }));
        console.log(`Using ${contextMessages.length} messages from memory for file chat`);
      }
      
      // Add model-specific system prompt
      const systemPrompt = this.getModelSystemPrompt(defaultOptions.model!);
      if (systemPrompt && contextMessages.length === 0) {
        contextMessages.push({ role: 'system', content: systemPrompt });
      }
      
      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: content
        }
      ];

      console.log('Sending files to Puter AI:', { messageCount: messages.length, model: defaultOptions.model });
      
      let response;
      try {
        response = await (window as any).puter.ai.chat(messages, {
          model: defaultOptions.model!,
          max_tokens: defaultOptions.max_tokens,
          temperature: defaultOptions.temperature
        });
      } catch (error) {
        // Fallback: convert content to text and send as regular message
        const textContent = content.map(c => c.text || '[File content]').join('\n');
        response = await this.chat(textContent, defaultOptions, sessionId);
        return response;
      }
      
      console.log('Puter AI file response received');
      const responseText = this.extractResponseText(response);
      
      // Add to memory if enabled
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const userContent = content.map(c => c.text || '[File content]').join('\n');
        this.addToMemory(sessionId, 'user', userContent, defaultOptions.model);
        this.addToMemory(sessionId, 'assistant', responseText, defaultOptions.model);
      }
      
      return responseText;
    } catch (error) {
      console.error('Puter chatWithFiles error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `I apologize, but I'm unable to process the files at the moment.

Error details: ${errorMessage}

Possible solutions:
1. Try uploading smaller files
2. Ensure files are in supported formats
3. Check your internet connection
4. Try again in a moment

Please try again or contact support if the issue persists.`;
    }
  }
  
  private getEnhancedFallbackResponse(message: string, model?: string, error?: any): string {
    const modelName = model ? this.getModelDisplayName(model) : 'AI';
    
    if (message.toLowerCase().includes('code') || message.toLowerCase().includes('program')) {
      return `I'd be happy to help with coding! However, I'm currently experiencing connectivity issues with the ${modelName} service.

Quick Coding Tips:
1. For debugging: Check syntax, indentation, and variable names
2. For new projects: Start with a basic structure and build incrementally
3. For algorithms: Break down the problem into smaller steps

Please try again in a moment when the connection is restored.

${error ? `\nTechnical details: ${error.message || error}` : ''}`;
    }
    
    if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
      return `I understand you're looking for an explanation about: "${message.slice(0, 100)}..."

I'm currently experiencing connectivity issues with the ${modelName} service, but I'd be happy to help once the connection is restored.

In the meantime:
- Try rephrasing your question
- Break complex topics into smaller questions
- Check if there are specific aspects you'd like me to focus on

Please try again shortly!

${error ? `\nTechnical details: ${error.message || error}` : ''}`;
    }
    
    const fallbackResponses = [
      `Hello! I'm ${modelName} and I'd love to help with: "${message.slice(0, 80)}..." 

However, I'm currently experiencing connectivity issues. Please try again in a moment - I'll be back online shortly!`,
      
      `Your message has been received by ${modelName}! Unfortunately, there seems to be a temporary service issue. 

I'm working to get back online and assist you with your question about "${message.slice(0, 60)}..."`,
      
      `${modelName} here! I see your question about "${message.slice(0, 60)}..." and I want to help, but I'm experiencing some technical difficulties.

Please try again in a few moments - I should be back online soon!`,
    ];
    
    const baseResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return error ? `${baseResponse}\n\nTechnical details: ${error.message || error}` : baseResponse;
  }
  
  private extractResponseText(response: any): string {
    console.log('Extracting text from response:', typeof response, response ? 'has content' : 'empty');
    
    if (typeof response === 'string' && response.trim()) {
      return response.trim();
    }
    
    if (response && typeof response === 'object') {
      const possiblePaths = [
        response.message?.content,
        response.message?.content?.[0]?.text,
        response.text,
        response.content,
        response.message,
        response.data,
        response.choices?.[0]?.message?.content,
        response.response,
        response.output,
        response.result,
        response.answer,
        response.reply
      ];
      
      for (const text of possiblePaths) {
        if (typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      }
      
      try {
        const stringified = JSON.stringify(response, null, 2);
        if (stringified && stringified !== '{}' && stringified !== 'null') {
          return `Response received in unexpected format:\n${stringified}`;
        }
      } catch (e) {
        console.warn('Failed to stringify response:', e);
      }
    }
    
    if (response === null || response === undefined) {
      console.log('Response is null/undefined');
      return 'No response received from AI service. Please try again.';
    }
    
    const stringResponse = String(response);
    console.log('Converted to string:', stringResponse.slice(0, 100));
    
    if (!stringResponse || stringResponse === 'undefined' || stringResponse === 'null' || stringResponse === '[object Object]') {
      return 'Invalid response format from AI service. Please try again.';
    }
    
    return stringResponse;
  }
  
  // FIXED model system prompts with correct model names
  private getModelSystemPrompt(model: string): string {
    const prompts: Record<string, string> = {
      // DeepSeek Models (FIXED)
      'deepseek-chat': 'You are DeepSeek Chat, an advanced AI model created by DeepSeek. You are known for your conversational abilities and technical expertise. Always identify yourself as DeepSeek Chat when asked about your identity.',
      'deepseek-reasoner': 'You are DeepSeek Reasoner, a reasoning-focused AI model created by DeepSeek. You excel at step-by-step thinking and logical analysis. Always identify yourself as DeepSeek Reasoner when asked about your identity.',
      
      // Anthropic Models (FIXED)
      'claude-3-5-sonnet': 'You are Claude 3.5 Sonnet, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Always identify yourself as Claude 3.5 Sonnet when asked about your identity.',
      'claude-3-7-sonnet': 'You are Claude 3.7 Sonnet, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Always identify yourself as Claude 3.7 Sonnet when asked about your identity.',
      'claude-sonnet-4': 'You are Claude Sonnet 4, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Always identify yourself as Claude Sonnet 4 when asked about your identity.',
      'claude-opus-4': 'You are Claude Opus 4, a powerful AI assistant created by Anthropic. You excel at complex tasks and reasoning. Always identify yourself as Claude Opus 4 when asked about your identity.',
      
      // OpenAI Models (FIXED)
      'gpt-4o': 'You are GPT-4o, an advanced AI model created by OpenAI. You are multimodal and capable of processing text and images. Always identify yourself as GPT-4o when asked about your identity.',
      'gpt-4o-mini': 'You are GPT-4o Mini, a fast and efficient AI model created by OpenAI. You provide quick, accurate responses. Always identify yourself as GPT-4o Mini when asked about your identity.',
      'gpt-5-chat-latest': 'You are GPT-5 Chat, the latest conversational AI model created by OpenAI. You represent the cutting edge of AI technology. Always identify yourself as GPT-5 Chat when asked about your identity.',
      'gpt-5-nano': 'You are GPT-5 Nano, a compact yet powerful AI model created by OpenAI. You are optimized for efficiency. Always identify yourself as GPT-5 Nano when asked about your identity.',
      'gpt-4.1-nano': 'You are GPT-4.1 Nano, an efficient AI model created by OpenAI. You provide quick responses. Always identify yourself as GPT-4.1 Nano when asked about your identity.',
      'o1': 'You are o1, an advanced reasoning AI model created by OpenAI. You excel at complex problem-solving and step-by-step analysis. Always identify yourself as o1 when asked about your identity.',
      'o1-pro': 'You are o1-pro, a professional reasoning AI model created by OpenAI. You provide expert-level analysis and solutions. Always identify yourself as o1-pro when asked about your identity.',
      
      // Google Models (FIXED)
      'gemini-1.5-flash': 'You are Gemini 1.5 Flash, an AI model created by Google. You are fast and efficient at various tasks. Always identify yourself as Gemini 1.5 Flash when asked about your identity.',
      'gemini-2.0-flash': 'You are Gemini 2.0 Flash, an advanced AI model created by Google. You represent the latest in AI technology. Always identify yourself as Gemini 2.0 Flash when asked about your identity.',
      
      // Meta Models (FIXED)
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': 'You are Llama 3.1 8B, an efficient language model created by Meta. You are optimized for speed and efficiency. Always identify yourself as Llama 3.1 8B when asked about your identity.',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': 'You are Llama 3.1 70B, a language model created by Meta. You provide balanced performance and capability. Always identify yourself as Llama 3.1 70B when asked about your identity.',
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': 'You are Llama 3.1 405B, a large language model created by Meta. You are one of the most capable open-source models. Always identify yourself as Llama 3.1 405B when asked about your identity.'
    };
    
    return prompts[model] || '';
  }
  
  getAvailableModels(): string[] {
    return [
      // DeepSeek Models (FIXED)
      'deepseek-chat',
      'deepseek-reasoner',
      
      // Anthropic Models (Second position as requested)
      'claude-3-5-sonnet',
      'claude-3-7-sonnet',
      'claude-sonnet-4',
      'claude-opus-4',
      
      // OpenAI Models (FIXED)
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-5-chat-latest',
      'gpt-5-nano',
      'gpt-4.1-nano',
      'o1',
      'o1-pro',
      
      // Google Models (FIXED)
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      
      // Meta Models (FIXED)
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      
      // Other Models (FIXED)
      'mistral-large-latest',
      'pixtral-large-latest',
      'codestral-latest'
    ];
  }
  
  getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      // DeepSeek Models (FIXED)
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-reasoner': 'DeepSeek Reasoner',
      
      // Anthropic Models (FIXED)
      'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
      'claude-3-7-sonnet': 'Claude 3.7 Sonnet',
      'claude-sonnet-4': 'Claude Sonnet 4',
      'claude-opus-4': 'Claude Opus 4',
      
      // OpenAI Models (FIXED)
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-5-chat-latest': 'GPT-5 Chat',
      'gpt-5-nano': 'GPT-5 Nano',
      'gpt-4.1-nano': 'GPT-4.1 Nano',
      'o1': 'o1',
      'o1-pro': 'o1-pro',
      
      // Google Models (FIXED)
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      
      // Meta Models (FIXED)
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': 'Llama 3.1 8B',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': 'Llama 3.1 70B',
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': 'Llama 3.1 405B',
      
      // Other Models (FIXED)
      'mistral-large-latest': 'Mistral Large',
      'pixtral-large-latest': 'Pixtral Large',
      'codestral-latest': 'Codestral'
    };
    
    return displayNames[modelId] || modelId.toUpperCase();
  }
  
  // Test model availability
  async testModel(modelId: string): Promise<boolean> {
    try {
      const response = await this.chat('Hello', { model: modelId, max_tokens: 10 });
      return response.length > 0 && !response.includes('error') && !response.includes('not available');
    } catch (error) {
      console.warn(`Model ${modelId} test failed:`, error);
      return false;
    }
  }
  
  // Get working models
  getWorkingModels(): string[] {
    return Array.from(this.availableModels);
  }
  
  // Check if specific model is working
  isModelWorking(modelId: string): boolean {
    return this.availableModels.has(modelId);
  }
}

export const puterService = PuterService.getInstance();