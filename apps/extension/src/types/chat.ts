export interface ChatMessage {
  id: string;
  text: string;
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