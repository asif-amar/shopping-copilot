import { SiteAdapterNameValues, SiteCredentials } from "@shopping-copilot/shared";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  adapterName?: SiteAdapterNameValues;
  credentials?: SiteCredentials[keyof SiteCredentials];
}