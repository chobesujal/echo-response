// Puter AI service integration with all supported models including GPT-5 and Claude-4
export interface PuterAIOptions {
  model?: string;
  context?: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  memory?: boolean;
}

export class PuterService {
  private static instance: PuterService;
  private chatMemory: Map<string, Array<{ role: string; content: string }>> = new Map();
  
  static getInstance(): PuterService {
    if (!PuterService.instance) {
      PuterService.instance = new PuterService();
    }
    return PuterService.instance;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      // Check if Puter SDK is loaded
      if (typeof (window as any).puter === 'undefined') {
        console.warn('Puter SDK not found in window object');
        return false;
      }
      
      if (typeof (window as any).puter.ai === 'undefined') {
        console.warn('Puter AI service not available');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking Puter availability:', error);
      return false;
    }
  }
  
  // Chat memory management
  addToMemory(sessionId: string, role: string, content: string) {
    if (!this.chatMemory.has(sessionId)) {
      this.chatMemory.set(sessionId, []);
    }
    const memory = this.chatMemory.get(sessionId)!;
    memory.push({ role, content });
    
    // Keep only last 20 messages to prevent memory overflow
    if (memory.length > 20) {
      this.chatMemory.set(sessionId, memory.slice(-20));
    }
  }
  
  getMemory(sessionId: string): Array<{ role: string; content: string }> {
    return this.chatMemory.get(sessionId) || [];
  }
  
  clearMemory(sessionId: string) {
    this.chatMemory.delete(sessionId);
  }
  
  async chat(message: string, options: PuterAIOptions = {}, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      console.log('Puter SDK not available, using fallback');
      return this.getFallbackResponse(message);
    }
    
    const defaultOptions: PuterAIOptions = {
      model: 'deepseek-v3',
      max_tokens: 2000,
      temperature: 0.7,
      memory: true,
      ...options
    };
    
    try {
      console.log('Calling Puter AI with:', { message, options: defaultOptions });
      
      // Add chat memory if enabled and sessionId provided
      let contextMessages = options.context || [];
      if (defaultOptions.memory && sessionId) {
        const memory = this.getMemory(sessionId);
        contextMessages = [...memory, ...contextMessages];
      }
      
      // Prepare the request
      const requestData = {
        model: this.mapModelName(defaultOptions.model!),
        messages: [
          ...contextMessages,
          { role: 'user', content: message }
        ],
        max_tokens: defaultOptions.max_tokens,
        temperature: defaultOptions.temperature
      };
      
      console.log('Sending request to Puter:', requestData);
      
      const response = await (window as any).puter.ai.chat(message, {
        model: requestData.model,
        context: contextMessages,
        max_tokens: requestData.max_tokens,
        temperature: requestData.temperature
      });
      
      console.log('Raw Puter response:', response);
      const responseText = this.extractResponseText(response);
      
      // Add to memory if enabled
      if (defaultOptions.memory && sessionId) {
        this.addToMemory(sessionId, 'user', message);
        this.addToMemory(sessionId, 'assistant', responseText);
      }
      
      return responseText;
    } catch (error) {
      console.error('Puter AI Error:', error);
      
      // Try fallback response for better user experience
      if (error instanceof Error && error.message.includes('model')) {
        return this.getFallbackResponse(message, `Model ${defaultOptions.model} may not be available. Using fallback response.`);
      }
      
      return this.getFallbackResponse(message, `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async imageToText(imageUrl: string, prompt?: string, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'Image processing service not available. Please ensure the Puter SDK is loaded.';
    }
    
    try {
      console.log('Processing image with Puter AI:', imageUrl);
      const response = await (window as any).puter.ai.img2txt(imageUrl, prompt || 'Describe this image in detail');
      console.log('Puter AI image response:', response);
      const responseText = this.extractResponseText(response);
      
      // Add to memory if sessionId provided
      if (sessionId) {
        this.addToMemory(sessionId, 'user', `[Image Analysis] ${prompt || 'Describe this image'}`);
        this.addToMemory(sessionId, 'assistant', responseText);
      }
      
      return responseText;
    } catch (error) {
      console.error('Puter imageToText error:', error);
      return `Image processing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async chatWithFiles(content: any[], options: PuterAIOptions = {}, sessionId?: string): Promise<string> {
    if (!await this.isAvailable()) {
      return 'File processing service not available. Please ensure the Puter SDK is loaded.';
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
      if (defaultOptions.memory && sessionId) {
        const memory = this.getMemory(sessionId);
        contextMessages = memory.map(m => ({ role: m.role, content: m.content }));
      }
      
      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: content
        }
      ];

      console.log('Sending files to Puter AI:', { messages, options: defaultOptions });
      const response = await (window as any).puter.ai.chat(messages, {
        model: this.mapModelName(defaultOptions.model!),
        max_tokens: defaultOptions.max_tokens,
        temperature: defaultOptions.temperature
      });
      
      console.log('Puter AI file response:', response);
      const responseText = this.extractResponseText(response);
      
      // Add to memory if enabled
      if (defaultOptions.memory && sessionId) {
        const userContent = content.map(c => c.text || '[File content]').join('\n');
        this.addToMemory(sessionId, 'user', userContent);
        this.addToMemory(sessionId, 'assistant', responseText);
      }
      
      return responseText;
    } catch (error) {
      console.error('Puter chatWithFiles error:', error);
      return `File processing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  private getFallbackResponse(message: string, errorMsg?: string): string {
    const fallbackResponses = [
      "I understand your question about: \"" + message.slice(0, 50) + "...\". However, I'm currently experiencing connectivity issues with the AI service. Please try again in a moment.",
      "I'd be happy to help with that! Unfortunately, there seems to be a temporary issue with the AI service. Please check your connection and try again.",
      "Your message has been received, but I'm unable to process it right now due to service connectivity. Please try again shortly.",
    ];
    
    const baseResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return errorMsg ? `${baseResponse}\n\nTechnical details: ${errorMsg}` : baseResponse;
  }
  
  private extractResponseText(response: any): string {
    console.log('Extracting text from response:', response, 'Type:', typeof response);
    
    if (typeof response === 'string') {
      return response;
    }
    
    if (response && typeof response === 'object') {
      // Handle various Puter response formats
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
        response.result
      ];
      
      for (const text of possiblePaths) {
        if (typeof text === 'string' && text.trim()) {
          return text;
        }
      }
    }
    
    if (response === null || response === undefined) {
      console.log('Response is null/undefined');
      return 'No response received from AI service.';
    }
    
    const stringResponse = String(response);
    console.log('Converted to string:', stringResponse);
    
    if (!stringResponse || stringResponse === 'undefined' || stringResponse === 'null') {
      return 'Invalid response format from AI service.';
    }
    
    return stringResponse;
  }
  
  getAvailableModels(): string[] {
    return [
      // GPT-5 Series (Latest)
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-5-chat-latest',
      
      // GPT-4.1 Series
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4.5-preview',
      
      // GPT-4 Series
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      
      // Claude-4 Series (Latest)
      'claude-sonnet-4',
      'claude-opus-4',
      
      // Claude-3 Series
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      
      // Google Models
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      
      // DeepSeek Models
      'deepseek-r1',
      'deepseek-v3',
      
      // Meta Models
      'llama-3.1-405b',
      'llama-3.1-70b',
      'llama-3.1-8b'
    ];
  }
  
  mapModelName(modelId: string): string {
    // Map to exact Puter model names with fallbacks for new models
    const modelMap: Record<string, string> = {
      // GPT-5 Series - Map to best available models
      'gpt-5': 'gpt-4o', // Fallback until GPT-5 is available
      'gpt-5-mini': 'gpt-4o-mini',
      'gpt-5-nano': 'gpt-4o-mini',
      'gpt-5-chat-latest': 'gpt-4o',
      
      // GPT-4.1 Series - Map to GPT-4 variants
      'gpt-4.1': 'gpt-4-turbo',
      'gpt-4.1-mini': 'gpt-4o-mini',
      'gpt-4.1-nano': 'gpt-4o-mini',
      'gpt-4.5-preview': 'gpt-4-turbo',
      
      // GPT-4 Series - Direct mapping
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      
      // Claude-4 Series - Map to Claude-3.5 until Claude-4 is available
      'claude-sonnet-4': 'claude-3-5-sonnet-20241022',
      'claude-opus-4': 'claude-3-opus-20240229',
      
      // Claude-3 Series - Direct mapping
      'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229': 'claude-3-opus-20240229',
      
      // Google - Direct mapping
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
      
      // DeepSeek - Direct mapping
      'deepseek-r1': 'deepseek-r1',
      'deepseek-v3': 'deepseek-v3',
      
      // Meta - Direct mapping
      'llama-3.1-405b': 'llama-3.1-405b',
      'llama-3.1-70b': 'llama-3.1-70b',
      'llama-3.1-8b': 'llama-3.1-8b'
    };
    
    const mappedModel = modelMap[modelId];
    if (!mappedModel) {
      console.warn(`Model ${modelId} not found in mapping, using deepseek-v3 as fallback`);
      return 'deepseek-v3';
    }
    
    console.log(`Mapped ${modelId} to ${mappedModel}`);
    return mappedModel;
  }
}

export const puterService = PuterService.getInstance();