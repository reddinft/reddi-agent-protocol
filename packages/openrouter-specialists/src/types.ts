export type SpecialistRole = "specialist" | "attestor" | "consumer";

export type SafetyMode = "standard" | "regulated-informational" | "attestation";

export interface SpecialistPrice {
  currency: "USDC" | "SOL";
  amount: string;
  unit: "request" | "1k_tokens";
}

export interface SpecialistProfile {
  id: string;
  displayName: string;
  description: string;
  walletAddress: string;
  endpointPath: string;
  capabilities: string[];
  roles: SpecialistRole[];
  price: SpecialistPrice;
  safetyMode: SafetyMode;
  preferredAttestors: string[];
  model: string;
  systemPrompt: string;
  tags: string[];
}

export interface RuntimeConfig {
  profileId: string;
  endpointBaseUrl: string;
  openRouterApiKey?: string;
  openRouterBaseUrl: string;
  mockOpenRouter: boolean;
  requirePayment: boolean;
  allowDemoPayment?: boolean;
  safetyMode?: SafetyMode;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages?: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OpenRouterClient {
  readonly callCount: number;
  createChatCompletion(input: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    metadata: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
}

export interface RuntimeResponse {
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}
