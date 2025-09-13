export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  hostname: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface VersionInfo {
  currentVersion: string;
  previousVersion?: string;
  lastSeenChangelogVersion?: string;
  installDate: Date;
  lastUpdateDate: Date;
}

export interface StorageData {
  conversations: Record<string, Conversation>;
  settings: {
    maxConversations: number;
    maxMessagesPerConversation: number;
  };
  versionInfo?: VersionInfo;
}

export interface StorageEvent {
  type: 'TAB_CHANGE' | 'MESSAGE_SAVED' | 'CONVERSATION_LOADED';
  data: {
    hostname?: string;
    conversationId?: string;
    message?: Message;
  };
}

export const DEFAULT_STORAGE_SETTINGS = {
  maxConversations: 50,
  maxMessagesPerConversation: 100
};