import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div
          style={{
            background: 'white',
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 4px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#6c757d',
                animation: 'pulse 1.4s infinite ease-in-out',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#6c757d',
                animation: 'pulse 1.4s infinite ease-in-out 0.2s',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#6c757d',
                animation: 'pulse 1.4s infinite ease-in-out 0.4s',
              }}
            />
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 60%, 100% { 
              transform: scale(0.8);
              opacity: 0.5;
            }
            30% { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};