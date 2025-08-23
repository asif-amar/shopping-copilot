import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #e9ecef',
        flexShrink: 0,
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: '40px',
            maxHeight: '120px',
            padding: '10px 12px',
            border: '1px solid #e9ecef',
            borderRadius: '20px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            background: isLoading ? '#f8f9fa' : 'white',
          }}
          onFocus={e => (e.target.style.borderColor = '#667eea')}
          onBlur={e => (e.target.style.borderColor = '#e9ecef')}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background:
              !inputText.trim() || isLoading
                ? '#e9ecef'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor:
              !inputText.trim() || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
};