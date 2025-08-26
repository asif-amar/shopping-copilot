import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            <ShoppingBag size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e293b',
                letterSpacing: '-0.02em',
              }}
            >
              Shopping Assistant
            </h1>
            <div
              style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{displayName || 'Loading...'}</span>
              {isSupported && (
                <span
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#16a34a',
                      borderRadius: '50%',
                    }}
                  />
                  Supported
                </span>
              )}
            </div>
          </div>
        </div>
        
        <motion.button
          onClick={onClearConversation}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: 'rgba(71, 85, 105, 0.08)',
            border: 'none',
            color: '#475569',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.08)';
          }}
          title="Clear conversation"
        >
          <Trash2 size={14} />
          Clear
        </motion.button>
      </div>
    </motion.div>
  );
};