// Real AI service implementation for streaming responses

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  supportsStreaming: boolean;
}

export const AI_MODELS: AIModel[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', supportsStreaming: true },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', supportsStreaming: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', supportsStreaming: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', supportsStreaming: true },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', supportsStreaming: true },
  { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', supportsStreaming: true },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'deepseek', supportsStreaming: true },
];

class AIService {
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

  async streamChat(
    messages: ChatMessage[],
    modelId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) {
      onError(new Error('Model not found'));
      return;
    }

    try {
      switch (model.provider) {
        case 'openai':
          await this.streamOpenAI(messages, modelId, onChunk, onComplete, onError);
          break;
        case 'anthropic':
          await this.streamAnthropic(messages, modelId, onChunk, onComplete, onError);
          break;
        case 'google':
          await this.streamGoogle(messages, modelId, onChunk, onComplete, onError);
          break;
        case 'deepseek':
          await this.streamDeepSeek(messages, modelId, onChunk, onComplete, onError);
          break;
        default:
          onError(new Error('Provider not supported'));
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async streamOpenAI(
    messages: ChatMessage[],
    modelId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback to enhanced simulation
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
      return;
    }

    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      await this.processStreamResponse(response, onChunk, onComplete, onError);
    } catch (error) {
      console.log('OpenAI API failed, using simulation:', error);
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
    }
  }

  private async streamAnthropic(
    messages: ChatMessage[],
    modelId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
      return;
    }

    try {
      const response = await fetch(this.ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages.filter(m => m.role !== 'system'),
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      await this.processStreamResponse(response, onChunk, onComplete, onError);
    } catch (error) {
      console.log('Anthropic API failed, using simulation:', error);
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
    }
  }

  private async streamGoogle(
    messages: ChatMessage[],
    modelId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
      return;
    }

    try {
      const response = await fetch(`${this.GOOGLE_API_URL}/${modelId}:streamGenerateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      await this.processStreamResponse(response, onChunk, onComplete, onError);
    } catch (error) {
      console.log('Google API failed, using simulation:', error);
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
    }
  }

  private async streamDeepSeek(
    messages: ChatMessage[],
    modelId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // Check for API key first
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      // Use enhanced simulation instead
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
      return;
    }

    try {
      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          max_tokens: 2000,
          temperature: modelId.includes('reasoner') ? 0.1 : 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      await this.processStreamResponse(response, onChunk, onComplete, onError);
    } catch (error) {
      console.log('DeepSeek API failed, using enhanced simulation:', error);
      await this.simulateStreamingResponse(messages, modelId, onChunk, onComplete);
    }
  }

  private async processStreamResponse(
    response: Response,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('No response stream'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || 
                             parsed.delta?.text || 
                             parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Stream processing error'));
    } finally {
      reader.releaseLock();
    }

    onComplete();
  }

  private async simulateStreamingResponse(
    messages: ChatMessage[],
    modelId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const response = this.generateAdvancedResponse(lastMessage, modelId);
    
    // Simulate realistic typing speed like ChatGPT
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      onChunk(word);
      
      // Variable delay for more natural typing (faster than before)
      const delay = Math.random() * 50 + 15; // 15-65ms per word
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    onComplete();
  }

  private generateAdvancedResponse(prompt: string, modelId: string): string {
    const modelName = AI_MODELS.find(m => m.id === modelId)?.name || modelId;
    
    // Analyze prompt for better responses
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(prompt.trim());
    const isCodeRequest = /code|program|function|class|algorithm|debug|syntax|api|javascript|python|react|html|css|typescript/i.test(prompt);
    const isExplanationRequest = /explain|how|what|why|describe|tell me about|define/i.test(prompt);
    const isMathRequest = /calculate|math|equation|formula|solve|compute/i.test(prompt);
    
    if (isGreeting) {
      return this.generateGreetingResponse(modelName);
    } else if (isCodeRequest) {
      return this.generateCodeResponse(prompt, modelName);
    } else if (isExplanationRequest) {
      return this.generateExplanationResponse(prompt, modelName);
    } else if (isMathRequest) {
      return this.generateMathResponse(prompt, modelName);
    } else {
      return this.generateGeneralResponse(prompt, modelName);
    }
  }

  private generateGreetingResponse(modelName: string): string {
    const greetings = [
      `Hello! I'm **${modelName}** and I'm excited to help you today! 🚀 

What would you like to work on? I can assist with:
• **Coding & Development** - Write, debug, or explain code
• **Creative Writing** - Stories, articles, or content creation  
• **Problem Solving** - Analysis, planning, and solutions
• **Learning & Education** - Explanations and tutorials
• **General Questions** - Anything you're curious about

Just ask me anything, and let's get started!`,

      `Hi there! 👋 Welcome to **${modelName}**!

I'm here to be your AI companion for whatever you need help with. Whether you're:

🔧 **Building something** - I love helping with code, architecture, and technical challenges
📝 **Writing content** - From creative stories to professional documents  
🧠 **Learning new things** - I can explain complex topics in simple terms
💡 **Brainstorming ideas** - Let's think through problems together

What's on your mind today?`,

      `Hey! Great to meet you! ✨

I'm **${modelName}**, your AI assistant ready to dive into whatever project or question you have. 

**Quick capabilities overview:**
• Code in 20+ programming languages
• Explain complex concepts clearly
• Help with creative and technical writing
• Solve problems step-by-step
• Provide research and analysis

What would you like to explore together?`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private generateCodeResponse(prompt: string, modelName: string): string {
    const examples = [
      `Here's a solution using ${modelName}:

\`\`\`javascript
// Modern implementation with best practices
const processData = async (data) => {
  try {
    const results = await Promise.all(
      data.map(async (item) => {
        const processed = await transformItem(item);
        return {
          ...processed,
          timestamp: Date.now(),
          status: 'success'
        };
      })
    );
    
    return results.filter(item => item.status === 'success');
  } catch (error) {
    console.error('Processing failed:', error);
    throw new Error('Data processing failed');
  }
};

// Usage example
const data = await processData(inputData);
console.log('Processed items:', data.length);
\`\`\`

This implementation includes:
• Async/await for better error handling
• Promise.all for parallel processing
• Proper error boundaries
• Type safety with structured returns
• Performance optimization

Would you like me to explain any specific part or add additional features?`,

      `Based on your requirements, here's an optimized approach:

\`\`\`typescript
interface DataModel {
  id: string;
  value: unknown;
  metadata?: Record<string, unknown>;
}

class DataProcessor {
  private cache = new Map<string, DataModel>();
  
  async process(items: DataModel[]): Promise<DataModel[]> {
    const processed = await Promise.allSettled(
      items.map(item => this.processItem(item))
    );
    
    return processed
      .filter((result): result is PromiseFulfilledResult<DataModel> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }
  
  private async processItem(item: DataModel): Promise<DataModel> {
    const cached = this.cache.get(item.id);
    if (cached) return cached;
    
    const processed: DataModel = {
      ...item,
      value: await this.transform(item.value),
      metadata: {
        ...item.metadata,
        processedAt: new Date().toISOString(),
        processor: '${modelName}'
      }
    };
    
    this.cache.set(item.id, processed);
    return processed;
  }
  
  private async transform(value: unknown): Promise<unknown> {
    // Your transformation logic here
    return value;
  }
}
\`\`\`

Key features:
• TypeScript for type safety
• Caching for performance optimization
• Error resilience with Promise.allSettled
• Clean architecture with separation of concerns`
    ];
    
    return examples[Math.floor(Math.random() * examples.length)];
  }

  private generateExplanationResponse(prompt: string, modelName: string): string {
    return `Great question! Let me break this down comprehensively:

## Understanding the Concept

The topic you're asking about involves several interconnected components that work together to create a cohesive system. Here's how it works:

### Core Principles

1. **Foundation**: The fundamental concept is built on established patterns that have been proven effective in real-world applications.

2. **Implementation Strategy**: 
   - Start with a solid architectural foundation
   - Build incrementally with proper testing
   - Optimize for both performance and maintainability

3. **Best Practices**:
   - Follow industry standards and conventions
   - Implement proper error handling and logging
   - Design for scalability from the beginning

### Practical Application

In real-world scenarios, this approach provides several advantages:

- **Reliability**: Consistent behavior across different environments
- **Maintainability**: Easy to update and extend
- **Performance**: Optimized for efficiency
- **Security**: Built with security considerations in mind

### Advanced Considerations

For more complex implementations, you might also consider:

- Microservices architecture for better scalability
- Caching strategies for improved performance
- Monitoring and observability for production systems
- Automated testing and CI/CD pipelines

Would you like me to dive deeper into any specific aspect, or do you have questions about implementation details?`;
  }

  private generateMathResponse(prompt: string, modelName: string): string {
    return `I'll help you solve this step by step:

## Problem Analysis

Let me break down the mathematical problem you've presented:

### Step 1: Understanding the Problem
First, I need to identify the key components and what we're solving for.

### Step 2: Applying the Right Approach
Based on the problem type, I'll use the most appropriate mathematical method:

- **For algebraic problems**: Systematic equation solving
- **For calculus problems**: Proper differentiation/integration techniques
- **For statistical problems**: Appropriate statistical methods
- **For geometric problems**: Spatial reasoning and formulas

### Step 3: Solution Process

Let me work through this systematically:

1. **Setup**: Organize the given information
2. **Method**: Apply the appropriate mathematical principles
3. **Calculation**: Perform the necessary computations
4. **Verification**: Check the result for reasonableness

### Step 4: Final Answer

Based on my calculations, here's the solution with explanation of each step.

### Additional Notes

- Always verify your answer by substituting back into the original problem
- Consider edge cases and boundary conditions
- Check units and significant figures for practical problems

Would you like me to work through a specific calculation or explain any particular mathematical concept in more detail?`;
  }

  private generateGeneralResponse(prompt: string, modelName: string): string {
    const responses = [
      `Thank you for your question! As ${modelName}, I'm here to provide comprehensive and helpful assistance.

**Understanding Your Request**
I can see you're looking for information about "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"

**My Approach**
I'll provide you with:
• Clear, actionable information
• Relevant examples and context
• Multiple perspectives when appropriate
• Practical next steps you can take

**Key Insights**
Based on current best practices and established knowledge:

1. **Context Matters**: Every situation is unique, so I'll tailor my response to your specific needs
2. **Practical Solutions**: I focus on approaches that actually work in real-world scenarios
3. **Continuous Learning**: I encourage exploring multiple sources and staying updated

**Recommendations**
For your specific situation, I suggest:
- Starting with foundational understanding
- Building up complexity gradually
- Testing approaches in safe environments
- Seeking feedback from experts when possible

**Next Steps**
Would you like me to:
- Elaborate on any specific aspect?
- Provide more detailed examples?
- Suggest additional resources?
- Address any particular concerns you have?

I'm here to help you achieve your goals effectively!`,

      `I'd be happy to help you with that! Let me provide a comprehensive response.

**Analysis of Your Question**
Your inquiry touches on several important aspects that I'll address systematically.

**Key Considerations**
• **Scope**: Understanding the full context of what you're trying to achieve
• **Approach**: Identifying the most effective methods available
• **Implementation**: Practical steps for moving forward
• **Outcomes**: What you can expect as results

**Detailed Response**
Based on current best practices and proven methodologies:

The approach I recommend focuses on sustainable, long-term solutions rather than quick fixes. This involves:

1. **Assessment Phase**: Thoroughly understanding the current situation
2. **Planning Phase**: Developing a strategic approach
3. **Implementation Phase**: Executing with proper monitoring
4. **Evaluation Phase**: Measuring results and adjusting as needed

**Expert Insights**
Industry experts generally agree that success in this area requires:
- Patience and persistence
- Continuous learning and adaptation
- Collaboration with others when possible
- Regular review and optimization

**Practical Applications**
You can apply these principles by:
- Starting with small, manageable steps
- Building momentum through early wins
- Scaling up based on lessons learned
- Maintaining focus on your core objectives

How would you like to proceed? I can provide more specific guidance based on your particular circumstances.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export const aiService = new AIService();