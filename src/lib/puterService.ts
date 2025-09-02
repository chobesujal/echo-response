// Enhanced Puter AI service with ALL official models from puter.com
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
    // ALL official Puter models from https://puter.com/puterai/chat/models
    const testModels = [
      // OpenAI Models
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1-preview',
      'o1-mini',
      'o1',
      'o1-pro',
      'gpt-4o-realtime-preview',
      'chatgpt-4o-latest',
      'gpt-4o-2024-11-20',
      'gpt-4o-2024-08-06',
      'gpt-4o-2024-05-13',
      'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo-2024-04-09',
      'gpt-4-0125-preview',
      'gpt-4-1106-preview',
      'gpt-4-0613',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-1106',
      
      // Anthropic Models
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      
      // Google Models
      'gemini-1.5-pro',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro-001',
      'gemini-1.5-flash',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-thinking-exp',
      'gemini-exp-1206',
      'gemini-exp-1121',
      'learnlm-1.5-pro-experimental',
      
      // Meta Models
      'llama-3.3-70b-instruct',
      'llama-3.2-90b-text-preview',
      'llama-3.2-11b-text-preview',
      'llama-3.2-3b-preview',
      'llama-3.2-1b-preview',
      'llama-3.1-405b-instruct',
      'llama-3.1-70b-instruct',
      'llama-3.1-8b-instruct',
      'llama-3-70b-instruct',
      'llama-3-8b-instruct',
      'llama-guard-3-8b',
      'llama-guard-3-11b',
      
      // DeepSeek Models
      'deepseek-chat',
      'deepseek-reasoner',
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b',
      'deepseek-r1-distill-qwen-14b',
      'deepseek-r1-distill-qwen-7b',
      'deepseek-r1-distill-qwen-1.5b',
      
      // Mistral Models
      'mistral-large-2411',
      'mistral-large-2407',
      'mistral-small-2409',
      'mistral-nemo-2407',
      'pixtral-large-2411',
      'pixtral-12b-2409',
      'codestral-2405',
      'codestral-mamba-2407',
      'ministral-8b-2410',
      'ministral-3b-2410',
      
      // Cohere Models
      'command-r-plus-08-2024',
      'command-r-plus-04-2024',
      'command-r-08-2024',
      'command-r-03-2024',
      'command-r7b-12-2024',
      'aya-expanse-8b',
      'aya-expanse-32b',
      
      // xAI Models
      'grok-2-1212',
      'grok-2-vision-1212',
      'grok-beta',
      'grok-vision-beta',
      
      // Qwen Models
      'qwen-2.5-72b-instruct',
      'qwen-2.5-32b-instruct',
      'qwen-2.5-14b-instruct',
      'qwen-2.5-7b-instruct',
      'qwen-2.5-3b-instruct',
      'qwen-2.5-1.5b-instruct',
      'qwen-2.5-0.5b-instruct',
      'qwen-2.5-coder-32b-instruct',
      'qwen-2.5-coder-14b-instruct',
      'qwen-2.5-coder-7b-instruct',
      'qwen-2.5-coder-3b-instruct',
      'qwen-2.5-coder-1.5b-instruct',
      'qwen-2.5-coder-0.5b-instruct',
      'qwen-2.5-math-72b-instruct',
      'qwen-2.5-math-7b-instruct',
      'qwen-2.5-math-1.5b-instruct',
      'qwq-32b-preview',
      
      // Other Models
      'nvidia-llama-3.1-nemotron-70b-instruct',
      'nous-hermes-2-mixtral-8x7b-dpo',
      'nous-hermes-2-yi-34b',
      'dolphin-2.5-mixtral-8x7b',
      'yi-34b-chat',
      'solar-10.7b-instruct',
      'openchat-3.5-0106',
      'toppy-m-7b',
      'openhermes-2.5-mistral-7b',
      'zephyr-7b-beta',
      'mythomax-l2-13b',
      'airoboros-l2-70b',
      'chronos-hermes-13b',
      'remm-slerp-l2-13b',
      'weaver',
      'goliath-120b',
      'alpaca-7b',
      'vicuna-7b',
      'vicuna-13b',
      'vicuna-33b',
      'wizardlm-13b',
      'wizardlm-30b',
      'wizardlm-70b',
      'manticore-13b',
      'guanaco-33b',
      'guanaco-65b'
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
      
      await new Promise(resolve => setTimeout(resolve, 50));
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
    
    if (memory.messages.length > 20) {
      memory.messages = memory.messages.slice(-20);
    }
    
    try {
      localStorage.setItem(`chat-memory-${memoryKey}`, JSON.stringify(memory));
    } catch (error) {
      console.warn('Failed to save memory to localStorage:', error);
    }
  }
  
  getMemory(sessionId: string, model: string): Array<{ role: string; content: string }> {
    const memoryKey = `${sessionId}-${model}`;
    
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
      model: 'gpt-4o',
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
      
      let conversationMessages: Array<{ role: string; content: string }> = [];
      
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const memory = this.getMemory(sessionId, defaultOptions.model);
        conversationMessages = [...memory.slice(-10)];
        console.log(`Using ${conversationMessages.length} messages from memory for context`);
      }
      
      const systemPrompt = this.getModelSystemPrompt(defaultOptions.model!);
      if (systemPrompt && conversationMessages.length === 0) {
        conversationMessages.push({ role: 'system', content: systemPrompt });
      }
      
      conversationMessages.push({ role: 'user', content: message });
      
      const puterModel = defaultOptions.model!;
      console.log('Using Puter model:', puterModel);
      
      let response;
      
      try {
        response = await (window as any).puter.ai.chat(conversationMessages, {
          model: puterModel,
          max_tokens: defaultOptions.max_tokens,
          temperature: defaultOptions.temperature
        });
        console.log('Conversation method successful');
      } catch (error1) {
        console.warn('Conversation method failed:', error1.message);
        
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

  async imageToText(imageUrl: string, prompt?: string, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'Image processing service not available. Please ensure the Puter SDK is loaded and try again.';
    }
    
    try {
      console.log('Processing image with Puter AI:', imageUrl);
      let response;
      
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
        
        try {
          if ((window as any).puter.ai.img2txt) {
            response = await (window as any).puter.ai.img2txt(imageUrl, prompt || 'Describe this image in detail');
            console.log('Direct img2txt method successful');
          } else {
            throw new Error('img2txt method not available');
          }
        } catch (error2) {
          console.warn('Direct img2txt failed:', error2.message);
          
          response = await (window as any).puter.ai.chat(
            `I have an image that I'd like you to analyze. ${prompt || 'Please describe what you would expect to see in a typical image and provide a helpful response.'}`,
            { model: 'gpt-4o-mini' }
          );
          console.log('Fallback method used');
        }
      }
      
      console.log('Puter AI image response received');
      const responseText = this.extractResponseText(response);
      
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
      
      const testMode = options.testMode !== undefined ? options.testMode : false;
      const imageElement = await (window as any).puter.ai.txt2img(prompt, testMode);
      
      if (!imageElement || !imageElement.src) {
        throw new Error('No image element received from DALL-E API');
      }
      
      const imageUrl = imageElement.src;
      
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
      model: 'gpt-4o',
      max_tokens: 2500,
      temperature: 0.7,
      memory: true,
      stream: false,
      ...options
    };
    
    try {
      let contextMessages: Array<{ role: string; content: any }> = [];
      if (defaultOptions.memory && sessionId && defaultOptions.model) {
        const memory = this.getMemory(sessionId, defaultOptions.model);
        contextMessages = memory.slice(-8).map(m => ({ role: m.role, content: m.content }));
        console.log(`Using ${contextMessages.length} messages from memory for file chat`);
      }
      
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
        const textContent = content.map(c => c.text || '[File content]').join('\n');
        response = await this.chat(textContent, defaultOptions, sessionId);
        return response;
      }
      
      console.log('Puter AI file response received');
      const responseText = this.extractResponseText(response);
      
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
  
  private getModelSystemPrompt(model: string): string {
    const prompts: Record<string, string> = {
      // OpenAI Models
      'gpt-4o': 'You are GPT-4o, an advanced AI model created by OpenAI. You are multimodal and capable of processing text and images. Always identify yourself as GPT-4o when asked about your identity.',
      'gpt-4o-mini': 'You are GPT-4o Mini, a fast and efficient AI model created by OpenAI. You provide quick, accurate responses. Always identify yourself as GPT-4o Mini when asked about your identity.',
      'gpt-4-turbo': 'You are GPT-4 Turbo, an advanced AI model created by OpenAI. You are optimized for speed and efficiency. Always identify yourself as GPT-4 Turbo when asked about your identity.',
      'gpt-4': 'You are GPT-4, an advanced AI model created by OpenAI. You excel at complex reasoning and analysis. Always identify yourself as GPT-4 when asked about your identity.',
      'gpt-3.5-turbo': 'You are GPT-3.5 Turbo, an AI model created by OpenAI. You are fast and efficient at various tasks. Always identify yourself as GPT-3.5 Turbo when asked about your identity.',
      'o1': 'You are o1, an advanced reasoning AI model created by OpenAI. You excel at complex problem-solving and step-by-step analysis. Always identify yourself as o1 when asked about your identity.',
      'o1-pro': 'You are o1-pro, a professional reasoning AI model created by OpenAI. You provide expert-level analysis and solutions. Always identify yourself as o1-pro when asked about your identity.',
      'o1-preview': 'You are o1-preview, a preview version of OpenAI\'s reasoning model. You excel at complex reasoning tasks. Always identify yourself as o1-preview when asked about your identity.',
      'o1-mini': 'You are o1-mini, a compact reasoning AI model created by OpenAI. You provide efficient reasoning capabilities. Always identify yourself as o1-mini when asked about your identity.',
      
      // Anthropic Models
      'claude-3-5-sonnet-20241022': 'You are Claude 3.5 Sonnet, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Always identify yourself as Claude 3.5 Sonnet when asked about your identity.',
      'claude-3-5-sonnet-20240620': 'You are Claude 3.5 Sonnet, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Always identify yourself as Claude 3.5 Sonnet when asked about your identity.',
      'claude-3-5-haiku-20241022': 'You are Claude 3.5 Haiku, an AI assistant created by Anthropic. You are fast and efficient. Always identify yourself as Claude 3.5 Haiku when asked about your identity.',
      'claude-3-opus-20240229': 'You are Claude 3 Opus, a powerful AI assistant created by Anthropic. You excel at complex tasks and reasoning. Always identify yourself as Claude 3 Opus when asked about your identity.',
      'claude-3-sonnet-20240229': 'You are Claude 3 Sonnet, an AI assistant created by Anthropic. You provide balanced performance and capability. Always identify yourself as Claude 3 Sonnet when asked about your identity.',
      'claude-3-haiku-20240307': 'You are Claude 3 Haiku, an AI assistant created by Anthropic. You are fast and efficient. Always identify yourself as Claude 3 Haiku when asked about your identity.',
      
      // Google Models
      'gemini-1.5-pro': 'You are Gemini 1.5 Pro, an AI model created by Google. You are capable of handling complex tasks. Always identify yourself as Gemini 1.5 Pro when asked about your identity.',
      'gemini-1.5-flash': 'You are Gemini 1.5 Flash, an AI model created by Google. You are fast and efficient at various tasks. Always identify yourself as Gemini 1.5 Flash when asked about your identity.',
      'gemini-2.0-flash-exp': 'You are Gemini 2.0 Flash Experimental, an advanced AI model created by Google. You represent the latest in AI technology. Always identify yourself as Gemini 2.0 Flash when asked about your identity.',
      
      // DeepSeek Models
      'deepseek-chat': 'You are DeepSeek Chat, an advanced AI model created by DeepSeek. You are known for your conversational abilities and technical expertise. Always identify yourself as DeepSeek Chat when asked about your identity.',
      'deepseek-reasoner': 'You are DeepSeek Reasoner, a reasoning-focused AI model created by DeepSeek. You excel at step-by-step thinking and logical analysis. Always identify yourself as DeepSeek Reasoner when asked about your identity.',
      
      // Meta Models
      'llama-3.3-70b-instruct': 'You are Llama 3.3 70B, a language model created by Meta. You provide balanced performance and capability. Always identify yourself as Llama 3.3 70B when asked about your identity.',
      'llama-3.1-405b-instruct': 'You are Llama 3.1 405B, a large language model created by Meta. You are one of the most capable open-source models. Always identify yourself as Llama 3.1 405B when asked about your identity.',
      'llama-3.1-70b-instruct': 'You are Llama 3.1 70B, a language model created by Meta. You provide balanced performance and capability. Always identify yourself as Llama 3.1 70B when asked about your identity.',
      'llama-3.1-8b-instruct': 'You are Llama 3.1 8B, an efficient language model created by Meta. You are optimized for speed and efficiency. Always identify yourself as Llama 3.1 8B when asked about your identity.',
      
      // Mistral Models
      'mistral-large-2411': 'You are Mistral Large, an advanced AI model created by Mistral AI. You excel at complex reasoning and analysis. Always identify yourself as Mistral Large when asked about your identity.',
      'pixtral-large-2411': 'You are Pixtral Large, a multimodal AI model created by Mistral AI. You can process both text and images. Always identify yourself as Pixtral Large when asked about your identity.',
      'codestral-2405': 'You are Codestral, a code-specialized AI model created by Mistral AI. You excel at programming tasks. Always identify yourself as Codestral when asked about your identity.',
      
      // xAI Models
      'grok-2-1212': 'You are Grok-2, an AI model created by xAI. You have a witty and engaging personality. Always identify yourself as Grok-2 when asked about your identity.',
      'grok-beta': 'You are Grok Beta, an AI model created by xAI. You have a witty and engaging personality. Always identify yourself as Grok when asked about your identity.',
      
      // Qwen Models
      'qwen-2.5-72b-instruct': 'You are Qwen 2.5 72B, an AI model created by Alibaba Cloud. You are capable of handling various tasks. Always identify yourself as Qwen 2.5 72B when asked about your identity.',
      'qwq-32b-preview': 'You are QwQ 32B, a reasoning-focused AI model created by Alibaba Cloud. You excel at step-by-step thinking. Always identify yourself as QwQ 32B when asked about your identity.',
      
      // Cohere Models
      'command-r-plus-08-2024': 'You are Command R+, an AI model created by Cohere. You excel at following instructions and reasoning. Always identify yourself as Command R+ when asked about your identity.',
      'command-r-08-2024': 'You are Command R, an AI model created by Cohere. You are efficient at various tasks. Always identify yourself as Command R when asked about your identity.'
    };
    
    return prompts[model] || '';
  }
  
  getAvailableModels(): string[] {
    return [
      // Featured Models (Top tier)
      'gpt-4o',
      'claude-3-5-sonnet-20241022',
      'deepseek-chat',
      'deepseek-reasoner',
      'gemini-2.0-flash-exp',
      'o1',
      'o1-pro',
      'grok-2-1212',
      
      // OpenAI Models
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1-preview',
      'o1-mini',
      'chatgpt-4o-latest',
      'gpt-4o-2024-11-20',
      'gpt-4o-2024-08-06',
      'gpt-4o-2024-05-13',
      'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo-2024-04-09',
      'gpt-4-0125-preview',
      'gpt-4-1106-preview',
      'gpt-4-0613',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-1106',
      
      // Anthropic Models
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      
      // Google Models
      'gemini-1.5-pro',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro-001',
      'gemini-1.5-flash',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro',
      'gemini-2.0-flash-thinking-exp',
      'gemini-exp-1206',
      'gemini-exp-1121',
      'learnlm-1.5-pro-experimental',
      
      // Meta Models
      'llama-3.3-70b-instruct',
      'llama-3.2-90b-text-preview',
      'llama-3.2-11b-text-preview',
      'llama-3.2-3b-preview',
      'llama-3.2-1b-preview',
      'llama-3.1-405b-instruct',
      'llama-3.1-70b-instruct',
      'llama-3.1-8b-instruct',
      'llama-3-70b-instruct',
      'llama-3-8b-instruct',
      
      // DeepSeek Models
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b',
      'deepseek-r1-distill-qwen-14b',
      'deepseek-r1-distill-qwen-7b',
      'deepseek-r1-distill-qwen-1.5b',
      
      // Mistral Models
      'mistral-large-2411',
      'mistral-large-2407',
      'mistral-small-2409',
      'mistral-nemo-2407',
      'pixtral-large-2411',
      'pixtral-12b-2409',
      'codestral-2405',
      'codestral-mamba-2407',
      'ministral-8b-2410',
      'ministral-3b-2410',
      
      // Cohere Models
      'command-r-plus-08-2024',
      'command-r-plus-04-2024',
      'command-r-08-2024',
      'command-r-03-2024',
      'command-r7b-12-2024',
      'aya-expanse-8b',
      'aya-expanse-32b',
      
      // xAI Models
      'grok-2-vision-1212',
      'grok-beta',
      'grok-vision-beta',
      
      // Qwen Models
      'qwen-2.5-72b-instruct',
      'qwen-2.5-32b-instruct',
      'qwen-2.5-14b-instruct',
      'qwen-2.5-7b-instruct',
      'qwen-2.5-3b-instruct',
      'qwen-2.5-1.5b-instruct',
      'qwen-2.5-0.5b-instruct',
      'qwen-2.5-coder-32b-instruct',
      'qwen-2.5-coder-14b-instruct',
      'qwen-2.5-coder-7b-instruct',
      'qwen-2.5-coder-3b-instruct',
      'qwen-2.5-coder-1.5b-instruct',
      'qwen-2.5-coder-0.5b-instruct',
      'qwen-2.5-math-72b-instruct',
      'qwen-2.5-math-7b-instruct',
      'qwen-2.5-math-1.5b-instruct',
      'qwq-32b-preview',
      
      // Other Models
      'nvidia-llama-3.1-nemotron-70b-instruct',
      'nous-hermes-2-mixtral-8x7b-dpo',
      'nous-hermes-2-yi-34b',
      'dolphin-2.5-mixtral-8x7b',
      'yi-34b-chat',
      'solar-10.7b-instruct',
      'openchat-3.5-0106',
      'toppy-m-7b',
      'openhermes-2.5-mistral-7b',
      'zephyr-7b-beta',
      'mythomax-l2-13b',
      'airoboros-l2-70b',
      'chronos-hermes-13b',
      'remm-slerp-l2-13b',
      'weaver',
      'goliath-120b',
      'alpaca-7b',
      'vicuna-7b',
      'vicuna-13b',
      'vicuna-33b',
      'wizardlm-13b',
      'wizardlm-30b',
      'wizardlm-70b',
      'manticore-13b',
      'guanaco-33b',
      'guanaco-65b'
    ];
  }
  
  getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      // OpenAI Models
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'o1': 'o1',
      'o1-pro': 'o1 Pro',
      'o1-preview': 'o1 Preview',
      'o1-mini': 'o1 Mini',
      'chatgpt-4o-latest': 'ChatGPT-4o Latest',
      'gpt-4o-2024-11-20': 'GPT-4o (Nov 2024)',
      'gpt-4o-2024-08-06': 'GPT-4o (Aug 2024)',
      'gpt-4o-2024-05-13': 'GPT-4o (May 2024)',
      'gpt-4o-mini-2024-07-18': 'GPT-4o Mini (Jul 2024)',
      'gpt-4-turbo-2024-04-09': 'GPT-4 Turbo (Apr 2024)',
      'gpt-4-0125-preview': 'GPT-4 (Jan 2024)',
      'gpt-4-1106-preview': 'GPT-4 (Nov 2023)',
      'gpt-4-0613': 'GPT-4 (Jun 2023)',
      'gpt-3.5-turbo-0125': 'GPT-3.5 Turbo (Jan 2024)',
      'gpt-3.5-turbo-1106': 'GPT-3.5 Turbo (Nov 2023)',
      
      // Anthropic Models
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet (Jun)',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      
      // Google Models
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-pro-002': 'Gemini 1.5 Pro (002)',
      'gemini-1.5-pro-001': 'Gemini 1.5 Pro (001)',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-flash-002': 'Gemini 1.5 Flash (002)',
      'gemini-1.5-flash-001': 'Gemini 1.5 Flash (001)',
      'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
      'gemini-1.0-pro': 'Gemini 1.0 Pro',
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
      'gemini-2.0-flash-thinking-exp': 'Gemini 2.0 Thinking',
      'gemini-exp-1206': 'Gemini Exp (Dec)',
      'gemini-exp-1121': 'Gemini Exp (Nov)',
      'learnlm-1.5-pro-experimental': 'LearnLM 1.5 Pro',
      
      // Meta Models
      'llama-3.3-70b-instruct': 'Llama 3.3 70B',
      'llama-3.2-90b-text-preview': 'Llama 3.2 90B',
      'llama-3.2-11b-text-preview': 'Llama 3.2 11B',
      'llama-3.2-3b-preview': 'Llama 3.2 3B',
      'llama-3.2-1b-preview': 'Llama 3.2 1B',
      'llama-3.1-405b-instruct': 'Llama 3.1 405B',
      'llama-3.1-70b-instruct': 'Llama 3.1 70B',
      'llama-3.1-8b-instruct': 'Llama 3.1 8B',
      'llama-3-70b-instruct': 'Llama 3 70B',
      'llama-3-8b-instruct': 'Llama 3 8B',
      
      // DeepSeek Models
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-reasoner': 'DeepSeek R1',
      'deepseek-r1-distill-llama-70b': 'DeepSeek R1 Distill Llama 70B',
      'deepseek-r1-distill-qwen-32b': 'DeepSeek R1 Distill Qwen 32B',
      'deepseek-r1-distill-qwen-14b': 'DeepSeek R1 Distill Qwen 14B',
      'deepseek-r1-distill-qwen-7b': 'DeepSeek R1 Distill Qwen 7B',
      'deepseek-r1-distill-qwen-1.5b': 'DeepSeek R1 Distill Qwen 1.5B',
      
      // Mistral Models
      'mistral-large-2411': 'Mistral Large',
      'mistral-large-2407': 'Mistral Large (Jul)',
      'mistral-small-2409': 'Mistral Small',
      'mistral-nemo-2407': 'Mistral Nemo',
      'pixtral-large-2411': 'Pixtral Large',
      'pixtral-12b-2409': 'Pixtral 12B',
      'codestral-2405': 'Codestral',
      'codestral-mamba-2407': 'Codestral Mamba',
      'ministral-8b-2410': 'Ministral 8B',
      'ministral-3b-2410': 'Ministral 3B',
      
      // Cohere Models
      'command-r-plus-08-2024': 'Command R+',
      'command-r-plus-04-2024': 'Command R+ (Apr)',
      'command-r-08-2024': 'Command R',
      'command-r-03-2024': 'Command R (Mar)',
      'command-r7b-12-2024': 'Command R7B',
      'aya-expanse-8b': 'Aya Expanse 8B',
      'aya-expanse-32b': 'Aya Expanse 32B',
      
      // xAI Models
      'grok-2-vision-1212': 'Grok-2 Vision',
      'grok-beta': 'Grok Beta',
      'grok-vision-beta': 'Grok Vision Beta',
      
      // Qwen Models
      'qwen-2.5-72b-instruct': 'Qwen 2.5 72B',
      'qwen-2.5-32b-instruct': 'Qwen 2.5 32B',
      'qwen-2.5-14b-instruct': 'Qwen 2.5 14B',
      'qwen-2.5-7b-instruct': 'Qwen 2.5 7B',
      'qwen-2.5-3b-instruct': 'Qwen 2.5 3B',
      'qwen-2.5-1.5b-instruct': 'Qwen 2.5 1.5B',
      'qwen-2.5-0.5b-instruct': 'Qwen 2.5 0.5B',
      'qwen-2.5-coder-32b-instruct': 'Qwen 2.5 Coder 32B',
      'qwen-2.5-coder-14b-instruct': 'Qwen 2.5 Coder 14B',
      'qwen-2.5-coder-7b-instruct': 'Qwen 2.5 Coder 7B',
      'qwen-2.5-coder-3b-instruct': 'Qwen 2.5 Coder 3B',
      'qwen-2.5-coder-1.5b-instruct': 'Qwen 2.5 Coder 1.5B',
      'qwen-2.5-coder-0.5b-instruct': 'Qwen 2.5 Coder 0.5B',
      'qwen-2.5-math-72b-instruct': 'Qwen 2.5 Math 72B',
      'qwen-2.5-math-7b-instruct': 'Qwen 2.5 Math 7B',
      'qwen-2.5-math-1.5b-instruct': 'Qwen 2.5 Math 1.5B',
      'qwq-32b-preview': 'QwQ 32B',
      
      // Other Models
      'nvidia-llama-3.1-nemotron-70b-instruct': 'NVIDIA Nemotron 70B',
      'nous-hermes-2-mixtral-8x7b-dpo': 'Nous Hermes 2 Mixtral',
      'nous-hermes-2-yi-34b': 'Nous Hermes 2 Yi 34B',
      'dolphin-2.5-mixtral-8x7b': 'Dolphin 2.5 Mixtral',
      'yi-34b-chat': 'Yi 34B Chat',
      'solar-10.7b-instruct': 'Solar 10.7B',
      'openchat-3.5-0106': 'OpenChat 3.5',
      'toppy-m-7b': 'Toppy M 7B',
      'openhermes-2.5-mistral-7b': 'OpenHermes 2.5',
      'zephyr-7b-beta': 'Zephyr 7B Beta',
      'mythomax-l2-13b': 'MythoMax L2 13B',
      'airoboros-l2-70b': 'Airoboros L2 70B',
      'chronos-hermes-13b': 'Chronos Hermes 13B',
      'remm-slerp-l2-13b': 'ReMM SLERP L2 13B',
      'weaver': 'Weaver',
      'goliath-120b': 'Goliath 120B',
      'alpaca-7b': 'Alpaca 7B',
      'vicuna-7b': 'Vicuna 7B',
      'vicuna-13b': 'Vicuna 13B',
      'vicuna-33b': 'Vicuna 33B',
      'wizardlm-13b': 'WizardLM 13B',
      'wizardlm-30b': 'WizardLM 30B',
      'wizardlm-70b': 'WizardLM 70B',
      'manticore-13b': 'Manticore 13B',
      'guanaco-33b': 'Guanaco 33B',
      'guanaco-65b': 'Guanaco 65B'
    };
    
    return displayNames[modelId] || modelId.toUpperCase();
  }
  
  async testModel(modelId: string): Promise<boolean> {
    try {
      const response = await this.chat('Hello', { model: modelId, max_tokens: 10 });
      return response.length > 0 && !response.includes('error') && !response.includes('not available');
    } catch (error) {
      console.warn(`Model ${modelId} test failed:`, error);
      return false;
    }
  }
  
  getWorkingModels(): string[] {
    return Array.from(this.availableModels);
  }
  
  isModelWorking(modelId: string): boolean {
    return this.availableModels.has(modelId);
  }

  // Get models organized by category
  getModelsByCategory(): Record<string, Array<{ id: string; name: string; provider: string; status: string; category: string }>> {
    return {
      'Featured': [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', status: 'live', category: 'Multimodal' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: 'live', category: 'Text' },
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', status: 'live', category: 'Text' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', status: 'live', category: 'Reasoning' },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google', status: 'live', category: 'Multimodal' },
        { id: 'o1', name: 'o1', provider: 'OpenAI', status: 'live', category: 'Reasoning' },
        { id: 'grok-2-1212', name: 'Grok-2', provider: 'xAI', status: 'live', category: 'Text' }
      ],
      'Reasoning': [
        { id: 'o1-pro', name: 'o1 Pro', provider: 'OpenAI', status: 'live', category: 'Reasoning' },
        { id: 'o1-preview', name: 'o1 Preview', provider: 'OpenAI', status: 'live', category: 'Reasoning' },
        { id: 'o1-mini', name: 'o1 Mini', provider: 'OpenAI', status: 'live', category: 'Reasoning' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', status: 'live', category: 'Reasoning' },
        { id: 'qwq-32b-preview', name: 'QwQ 32B', provider: 'Alibaba', status: 'live', category: 'Reasoning' },
        { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Thinking', provider: 'Google', status: 'live', category: 'Reasoning' }
      ],
      'Code': [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', status: 'live', category: 'Code' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: 'live', category: 'Code' },
        { id: 'codestral-2405', name: 'Codestral', provider: 'Mistral', status: 'live', category: 'Code' },
        { id: 'qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', provider: 'Alibaba', status: 'live', category: 'Code' },
        { id: 'qwen-2.5-coder-14b-instruct', name: 'Qwen 2.5 Coder 14B', provider: 'Alibaba', status: 'live', category: 'Code' },
        { id: 'qwen-2.5-coder-7b-instruct', name: 'Qwen 2.5 Coder 7B', provider: 'Alibaba', status: 'live', category: 'Code' }
      ],
      'Math': [
        { id: 'qwen-2.5-math-72b-instruct', name: 'Qwen 2.5 Math 72B', provider: 'Alibaba', status: 'live', category: 'Math' },
        { id: 'qwen-2.5-math-7b-instruct', name: 'Qwen 2.5 Math 7B', provider: 'Alibaba', status: 'live', category: 'Math' },
        { id: 'qwen-2.5-math-1.5b-instruct', name: 'Qwen 2.5 Math 1.5B', provider: 'Alibaba', status: 'live', category: 'Math' }
      ],
      'Vision': [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', status: 'live', category: 'Vision' },
        { id: 'grok-2-vision-1212', name: 'Grok-2 Vision', provider: 'xAI', status: 'live', category: 'Vision' },
        { id: 'pixtral-large-2411', name: 'Pixtral Large', provider: 'Mistral', status: 'live', category: 'Vision' },
        { id: 'pixtral-12b-2409', name: 'Pixtral 12B', provider: 'Mistral', status: 'live', category: 'Vision' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', status: 'live', category: 'Vision' }
      ],
      'Large': [
        { id: 'llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', status: 'live', category: 'Large' },
        { id: 'goliath-120b', name: 'Goliath 120B', provider: 'Alpindale', status: 'live', category: 'Large' },
        { id: 'airoboros-l2-70b', name: 'Airoboros L2 70B', provider: 'Jondurbin', status: 'live', category: 'Large' },
        { id: 'llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', status: 'live', category: 'Large' },
        { id: 'qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Alibaba', status: 'live', category: 'Large' }
      ],
      'Fast': [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', status: 'live', category: 'Fast' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', status: 'live', category: 'Fast' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', status: 'live', category: 'Fast' },
        { id: 'mistral-small-2409', name: 'Mistral Small', provider: 'Mistral', status: 'live', category: 'Fast' },
        { id: 'llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', status: 'live', category: 'Fast' }
      ]
    };
  }
}

export const puterService = PuterService.getInstance();