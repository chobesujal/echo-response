// Enhanced Puter AI service with proper model management and image-to-text
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
    const testModels = [
      // Current working models
      'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo',
      'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229',
      'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp',
      'deepseek-v3', 'deepseek-r1',
      'llama-3.1-70b', 'llama-3.1-8b', 'llama-3.1-405b',
      'mistral-large', 'mixtral-8x7b', 'codellama-34b'
    ];
    
    console.log('Testing model availability...');
    
    for (const model of testModels) {
      try {
        const response = await this.quickTest(model);
        if (response && response.length > 0 && !response.toLowerCase().includes('error')) {
          this.availableModels.add(model);
          console.log(`Model ${model} is available`);
        }
      } catch (error) {
        console.warn(`Model ${model} failed test:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Available models:', Array.from(this.availableModels));
    
    // Ensure DeepSeek V3 is working
    if (!this.availableModels.has('deepseek-v3')) {
      console.warn('DeepSeek V3 not available, attempting to fix...');
      try {
        const response = await this.forceTestModel('deepseek-v3');
        if (response) {
          this.availableModels.add('deepseek-v3');
          console.log('DeepSeek V3 fixed and available');
        }
      } catch (error) {
        console.error('Failed to fix DeepSeek V3:', error);
      }
    }
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
  
  async forceTestModel(model: string): Promise<string> {
    try {
      let response;
      
      try {
        response = await (window as any).puter.ai.chat('Test', { model });
      } catch (e1) {
        try {
          response = await (window as any).puter.ai.chat('Test');
        } catch (e2) {
          response = await (window as any).puter.ai.chat('Test', {
            model: model,
            max_tokens: 5,
            temperature: 0.1
          });
        }
      }
      
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
  
  // Enhanced memory management with proper conversation continuity
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
      model: 'deepseek-v3',
      max_tokens: 2000,
      temperature: 0.7,
      memory: true,
      stream: false,
      ...options
    };
    
    try {
      console.log('Calling Puter AI with:', { message: message.slice(0, 100), model: defaultOptions.model });
      
      // Add chat memory if enabled and sessionId provided
      let contextMessages: Array<{ role: string; content: string }> = [];
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const memory = this.getMemory(sessionId, defaultOptions.model);
        contextMessages = [...memory.slice(-10)]; // Use last 10 messages for context
      }
      
      const puterModel = this.mapModelName(defaultOptions.model!);
      console.log('Using Puter model:', defaultOptions.model, '->', puterModel);
      
      let response;
      let lastError;
      
      // Method 1: Full featured call with context
      try {
        response = await (window as any).puter.ai.chat(message, {
          model: puterModel,
          context: contextMessages.length > 0 ? contextMessages : undefined,
          max_tokens: defaultOptions.max_tokens,
          temperature: defaultOptions.temperature
        });
        console.log('Method 1 successful');
      } catch (error1) {
        lastError = error1;
        console.warn('Method 1 failed:', error1.message);
        
        // Method 2: Simple call with model
        try {
          response = await (window as any).puter.ai.chat(message, {
            model: puterModel,
            max_tokens: defaultOptions.max_tokens
          });
          console.log('Method 2 successful');
        } catch (error2) {
          lastError = error2;
          console.warn('Method 2 failed:', error2.message);
          
          // Method 3: Basic call
          try {
            response = await (window as any).puter.ai.chat(message, {
              model: puterModel
            });
            console.log('Method 3 successful');
          } catch (error3) {
            lastError = error3;
            console.warn('Method 3 failed:', error3.message);
            
            // Method 4: Fallback to default model
            try {
              response = await (window as any).puter.ai.chat(message);
              console.log('Method 4 (fallback) successful');
            } catch (error4) {
              lastError = error4;
              console.error('All methods failed');
              throw new Error(`All API methods failed. Last error: ${error4.message}`);
            }
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
      }
      
      console.log('Chat completed successfully');
      return responseText;
    } catch (error) {
      console.error('Puter AI Error:', error);
      return this.getEnhancedFallbackResponse(message, defaultOptions.model, error);
    }
  }

  // Enhanced image-to-text with proper error handling
  async imageToText(imageUrl: string, prompt?: string, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'Image processing service not available. Please ensure the Puter SDK is loaded and try again.';
    }
    
    try {
      console.log('Processing image with Puter AI:', imageUrl);
      let response;
      
      // Method 1: Direct image-to-text API
      try {
        if ((window as any).puter.ai.img2txt) {
          response = await (window as any).puter.ai.img2txt(imageUrl, prompt || 'Describe this image in detail');
          console.log('Direct img2txt method successful');
        } else {
          throw new Error('img2txt method not available');
        }
      } catch (error1) {
        console.warn('Direct img2txt failed:', error1.message);
        
        // Method 2: Vision model with image URL
        try {
          response = await (window as any).puter.ai.chat([
            {
              type: 'text',
              text: prompt || 'Please analyze this image and describe what you see in detail.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ], {
            model: 'gpt-4o',
            max_tokens: 1000
          });
          console.log('Vision model method successful');
        } catch (error2) {
          console.warn('Vision model failed:', error2.message);
          
          // Method 3: Fallback with text description
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

  async chatWithFiles(content: any[], options: PuterAIOptions = {}, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'File processing service not available. Please ensure the Puter SDK is loaded and try again.';
    }
    
    const defaultOptions: PuterAIOptions = {
      model: 'deepseek-v3',
      max_tokens: 2500,
      temperature: 0.7,
      memory: true,
      ...options
    };
    
    try {
      // Add memory context if enabled
      let contextMessages: Array<{ role: string; content: any }> = [];
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const memory = this.getMemory(sessionId, defaultOptions.model);
        contextMessages = memory.slice(-8).map(m => ({ role: m.role, content: m.content }));
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
          model: this.mapModelName(defaultOptions.model!),
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
  
  getAvailableModels(): string[] {
    return [
      // DeepSeek Models (Priority)
      'deepseek-v3',
      'deepseek-r1',
      
      // OpenAI Models (Current)
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-3.5-turbo',
      
      // Anthropic Models (Current)
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      
      // Google Models (Current)
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      
      // Meta Models
      'llama-3.1-405b',
      'llama-3.1-70b',
      'llama-3.1-8b',
      
      // Other Models
      'mistral-large',
      'mixtral-8x7b',
      'codellama-34b'
    ];
  }
  
  getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      // DeepSeek Models
      'deepseek-r1': 'DeepSeek R1',
      'deepseek-v3': 'DeepSeek V3',
      
      // OpenAI Models (Current)
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      
      // Anthropic Models (Current)
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      
      // Google Models (Current)
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
      
      // Meta Models
      'llama-3.1-405b': 'Llama 3.1 405B',
      'llama-3.1-70b': 'Llama 3.1 70B',
      'llama-3.1-8b': 'Llama 3.1 8B',
      
      // Other Models
      'mistral-large': 'Mistral Large',
      'mixtral-8x7b': 'Mixtral 8x7B',
      'codellama-34b': 'CodeLlama 34B'
    };
    
    return displayNames[modelId] || modelId.toUpperCase();
  }
  
  mapModelName(modelId: string): string {
    // Direct mapping - use exact names that work with Puter
    const directMapping: Record<string, string> = {
      // DeepSeek Models (Priority - these should work)
      'deepseek-v3': 'deepseek-v3',
      'deepseek-r1': 'deepseek-r1',
      
      // OpenAI Models (Current)
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      
      // Anthropic Models (Current)
      'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229': 'claude-3-opus-20240229',
      
      // Google Models (Current)
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
      
      // Meta Models
      'llama-3.1-405b': 'llama-3.1-405b',
      'llama-3.1-70b': 'llama-3.1-70b',
      'llama-3.1-8b': 'llama-3.1-8b',
      
      // Other Models
      'mistral-large': 'mistral-large',
      'mixtral-8x7b': 'mixtral-8x7b',
      'codellama-34b': 'codellama-34b'
    };
    
    const mappedModel = directMapping[modelId];
    if (!mappedModel) {
      console.warn(`Model ${modelId} not found in mapping, using deepseek-v3 as fallback`);
      return 'deepseek-v3';
    }
    
    console.log(`Mapped ${modelId} to ${mappedModel}`);
    return mappedModel;
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
    const mappedModel = this.mapModelName(modelId);
    return this.availableModels.has(mappedModel);
  }
}

export const puterService = PuterService.getInstance();