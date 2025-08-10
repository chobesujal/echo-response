// Puter AI service integration with all supported models
export interface PuterAIOptions {
  model?: string;
  context?: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
}

export class PuterService {
  private static instance: PuterService;
  
  static getInstance(): PuterService {
    if (!PuterService.instance) {
      PuterService.instance = new PuterService();
    }
    return PuterService.instance;
  }
  
  async isAvailable(): Promise<boolean> {
    return typeof (window as any).puter !== 'undefined' && 
           typeof (window as any).puter.ai !== 'undefined';
  }
  
  async chat(message: string, options: PuterAIOptions = {}): Promise<string> {
    if (!await this.isAvailable()) {
      console.log('Puter SDK not available, will use fallback');
      throw new Error('Puter SDK not available');
    }
    
    const defaultOptions: PuterAIOptions = {
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.7,
      ...options
    };
    
    try {
      const response = await (window as any).puter.ai.chat(message, defaultOptions);
      console.log('Raw Puter response:', response);
      return this.extractResponseText(response);
    } catch (error) {
      console.error('Puter AI Error:', error);
      throw error;
    }
  }

  async imageToText(imageUrl: string, prompt?: string): Promise<string> {
    if (!await this.isAvailable()) {
      throw new Error('Puter SDK not available');
    }
    
    try {
      console.log('Processing image with Puter AI:', imageUrl);
      const response = await (window as any).puter.ai.img2txt(imageUrl, prompt);
      console.log('Puter AI image response:', response);
      return this.extractResponseText(response);
    } catch (error) {
      console.error('Puter imageToText error:', error);
      throw error;
    }
  }

  async chatWithFiles(content: any[], options: PuterAIOptions = {}): Promise<string> {
    if (!await this.isAvailable()) {
      throw new Error('Puter SDK not available');
    }
    
    const defaultOptions: PuterAIOptions = {
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      temperature: 0.7,
      ...options
    };
    
    try {
      const messages = [
        {
          role: 'user',
          content: content
        }
      ];

      console.log('Sending files to Puter AI:', { messages, options: defaultOptions });
      const response = await (window as any).puter.ai.chat(messages, defaultOptions);
      console.log('Puter AI file response:', response);
      return this.extractResponseText(response);
    } catch (error) {
      console.error('Puter chatWithFiles error:', error);
      throw error;
    }
  }
  
  private extractResponseText(response: any): string {
    console.log('Extracting text from response:', response, 'Type:', typeof response);
    
    if (typeof response === 'string') {
      return response;
    }
    
    if (response && typeof response === 'object') {
      // Handle various Puter response formats
      if (response.message?.content) {
        return response.message.content;
      }
      
      if (response.message?.content?.[0]?.text) {
        return response.message.content[0].text;
      }
      
      // Try other common response formats
      const possibleTexts = [
        response.text,
        response.content,
        response.message,
        response.data,
        response.choices?.[0]?.message?.content,
        response.response,
        response.output,
        response.result
      ];
      
      for (const text of possibleTexts) {
        if (typeof text === 'string' && text.trim()) {
          return text;
        }
      }
    }
    
    if (response === null || response === undefined) {
      console.log('Response is null/undefined');
      throw new Error('No response received from AI service.');
    }
    
    const stringResponse = String(response);
    console.log('Converted to string:', stringResponse);
    
    if (!stringResponse || stringResponse === 'undefined' || stringResponse === 'null') {
      throw new Error('Invalid response format.');
    }
    
    return stringResponse;
  }
  
  getAvailableModels(): string[] {
    return [
      // OpenAI Models
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      
      // Anthropic Models
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
    // Map to exact Puter model names
    const modelMap: Record<string, string> = {
      // OpenAI
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      
      // Anthropic
      'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229': 'claude-3-opus-20240229',
      
      // Google
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
      
      // DeepSeek
      'deepseek-r1': 'deepseek-r1',
      'deepseek-v3': 'deepseek-v3',
      
      // Meta
      'llama-3.1-405b': 'llama-3.1-405b',
      'llama-3.1-70b': 'llama-3.1-70b',
      'llama-3.1-8b': 'llama-3.1-8b'
    };
    
    return modelMap[modelId] || 'deepseek-v3';
  }
}

export const puterService = PuterService.getInstance();