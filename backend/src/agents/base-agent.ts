import Anthropic from '@anthropic-ai/sdk';

export abstract class BaseAgent {
  protected client: Anthropic;
  protected model: string = 'claude-sonnet-4-20250514';

  constructor() {
    this.client = new Anthropic();
  }

  protected async chat(
    systemPrompt: string,
    userMessage: string
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return textBlock.text;
  }

  protected parseJsonResponse<T>(response: string): T {
    // Try to extract JSON from markdown code blocks first
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();

    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
