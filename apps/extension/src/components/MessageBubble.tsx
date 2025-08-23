import React from 'react';
import { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: message.isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: message.isUser
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        {message.isUser ? '👤' : '🤖'}
      </div>

      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div
          style={{
            background: message.isUser ? '#667eea' : 'white',
            color: message.isUser ? 'white' : '#333',
            padding: '12px 16px',
            borderRadius: message.isUser
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            fontSize: '14px',
            lineHeight: '1.4',
            border: message.isUser ? 'none' : '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {message.text}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#6c757d',
            textAlign: message.isUser ? 'right' : 'left',
            paddingLeft: message.isUser ? '0' : '4px',
            paddingRight: message.isUser ? '4px' : '0',
          }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};