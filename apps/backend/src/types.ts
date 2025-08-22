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

export interface ErrorResponse {
  error: string;
  code?: string;
}

// Database Types
export interface User {
  id: number;
  email?: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string; // UUID
  user_id: number;
  title?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageDB {
  id: number;
  conversation_id: string; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

export interface CreateUserRequest {
  email?: string;
  name?: string;
}

export interface CreateConversationRequest {
  user_id: number;
  title?: string;
}

export interface CreateMessageRequest {
  conversation_id: string; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
}