import type { ChatMessage, OpenRouterClient } from "./types.js";

export class MockOpenRouterClient implements OpenRouterClient {
  public callCount = 0;
  public lastRequest?: {
    model: string;
    messages: ChatMessage[];
    metadata: Record<string, unknown>;
  };

  async createChatCompletion(input: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    metadata: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    this.callCount += 1;
    this.lastRequest = input;
    return {
      id: `chatcmpl_mock_${this.callCount}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: input.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `Mock specialist response for ${input.metadata.profileId}`,
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    };
  }
}

export class FetchOpenRouterClient implements OpenRouterClient {
  public callCount = 0;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://openrouter.ai/api/v1",
  ) {}

  async createChatCompletion(input: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    metadata: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    this.callCount += 1;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
        "x-reddi-profile-id": String(input.metadata.profileId),
        "x-reddi-request-id": String(input.metadata.requestId),
      },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status} ${JSON.stringify(body)}`);
    }
    return body;
  }
}
