import React from 'react';
import '@/styles/global.css';
import { useChat } from '@/hooks/useChat';
import { Header, MessageList, ChatInput } from '@/components';

export const SidePanel: React.FC = () => {
  const { messages, isLoading, currentHostname, sendMessage, clearConversation } = useChat();

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Header 
        currentHostname={currentHostname}
        onClearConversation={clearConversation}
      />
      
      <MessageList 
        messages={messages}
        isLoading={isLoading}
      />
      
      <ChatInput 
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};