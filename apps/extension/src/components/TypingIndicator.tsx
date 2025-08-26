import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator: React.FC = () => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div
          className="thinking-text"
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#374151',
            background: 'linear-gradient(90deg, #9ca3af 0%, #374151 25%, #111827 50%, #374151 75%, #9ca3af 100%)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'slideColors 2s ease-in-out infinite',
          }}
        >
          Thinking...
        </div>
      </motion.div>

      <style>
        {`
          @keyframes slideColors {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}
      </style>
    </>
  );
};