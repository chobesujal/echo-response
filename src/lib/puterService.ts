// Puter AI service integration
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
      throw new Error('Puter SDK not available');
    }
    
    const defaultOptions: PuterAIOptions = {
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7,
      ...options
    };
    
    try {
      const response = await (window as any).puter.ai.chat(message, defaultOptions);
      return this.extractResponseText(response);
    } catch (error) {
      console.error('Puter AI Error:', error);
      throw error;
    }
  }
  
  private extractResponseText(response: any): string {
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
        response.output
      ];
      
      for (const text of possibleTexts) {
        if (typeof text === 'string' && text.trim()) {
          return text;
        }
      }
    }
    
    if (response === null || response === undefined) {
      return 'No response received from AI service.';
    }
    
    return String(response) || 'Invalid response format.';
  }
  
  getAvailableModels(): string[] {
    return [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'claude-3-5-sonnet',
      'claude-3-opus',
      'gemini-2.0-flash-exp',
      'deepseek-v3',
      'deepseek-r1'
    ];
  }
  
  mapModelName(modelId: string): string {
    const modelMap: Record<string, string> = {
      'deepseek-reasoner': 'deepseek-r1',
      'deepseek-chat': 'deepseek-v3',
      'gemini-2.0-flash': 'gemini-2.0-flash-exp',
      'claude-3-5-sonnet': 'claude-3-5-sonnet',
      'claude-3-opus': 'claude-3-opus',
      'gpt-4': 'gpt-4',
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-3.5-turbo': 'gpt-3.5-turbo'
    };
    
    return modelMap[modelId] || 'gpt-3.5-turbo';
  }
}

export const puterService = PuterService.getInstance();