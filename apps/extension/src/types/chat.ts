export interface Product {
  name: string;
  price: string;
  availability: string;
  url: string;
  image: string;
  brand?: string;
  category?: string;
  rating?: string;
  description?: string;
  product_id: string;
}

export interface MessagePart {
  type: 'text' | 'tool-call' | 'products';
  id: string;
}

export interface TextPart extends MessagePart {
  type: 'text';
  content: string;
}

export interface ToolCallPart extends MessagePart {
  type: 'tool-call';
  toolName: string;
  displayName: string;
  state: 'started' | 'completed' | 'error';
  errorText?: string;
}

export interface ProductsPart extends MessagePart {
  type: 'products';
  products: Product[];
  isLoading?: boolean;
}

export type MessagePartType = TextPart | ToolCallPart | ProductsPart;

export interface ChatMessage {
  id: string;
  parts: MessagePartType[];
  isUser: boolean;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentHostname: string;
}

export type MessageType = 
  | 'GET_CONVERSATION'
  | 'SAVE_MESSAGE'
  | 'CLEAR_CONVERSATION'
  | 'GET_CURRENT_HOSTNAME'
  | 'HOSTNAME_CHANGED';

export interface ChromeMessage<T = any> {
  type: MessageType;
  data?: T;
}

export interface ConversationData {
  hostname: string;
  message?: ChatMessage;
}