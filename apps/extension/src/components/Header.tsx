import React from 'react';
import { getSiteAdapterFromHostname, getSiteDisplayName, isShoppingSite } from '@/services/websiteContext';

interface HeaderProps {
  currentHostname: string;
  onClearConversation: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentHostname, onClearConversation }) => {
  const siteAdapter = getSiteAdapterFromHostname(currentHostname);
  const displayName = siteAdapter ? getSiteDisplayName(siteAdapter) : currentHostname;
  const isSupported = isShoppingSite(currentHostname);
  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderBottom: '1px solid #e9ecef',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          🛍️
        </div>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            shopAI Chat
          </h1>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{displayName || 'Loading...'}</span>
            {isSupported && (
              <span
                style={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500',
                }}
              >
                🛒 Shopping
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onClearConversation}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={e =>
            (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')
          }
          onMouseOut={e =>
            (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')
          }
          title="Clear conversation"
        >
          Clear
        </button>
      </div>
    </div>
  );
};