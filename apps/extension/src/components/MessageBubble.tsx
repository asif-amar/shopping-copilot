import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      console.log('Text copied to clipboard');
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false); // Clear dislike if set
    console.log('Message liked:', message.id);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false); // Clear like if set
    console.log('Message disliked:', message.id);
  };

  if (message.isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            background: '#2563eb',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '18px',
            fontSize: '14px',
            lineHeight: '1.4',
            direction: isHebrew(message.text) ? 'rtl' : 'ltr',
            textAlign: isHebrew(message.text) ? 'right' : 'left',
          }}
        >
          {message.text}
        </div>
      </motion.div>
    );
  }

  return (
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
        style={{
          maxWidth: '85%',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#374151',
          direction: isHebrew(message.text) ? 'rtl' : 'ltr',
          textAlign: isHebrew(message.text) ? 'right' : 'left',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.text}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '8px',
          alignItems: 'center',
        }}
      >
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: copied ? '#dcfce7' : 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: copied ? '#16a34a' : '#6b7280',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!copied) e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={copied ? "Copied!" : "Copy message"}
        >
          <motion.div
            initial={false}
            animate={{ scale: copied ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </motion.div>
        </motion.button>
        
        <motion.button
          onClick={handleLike}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: liked ? '#eff6ff' : 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: liked ? '#3b82f6' : '#6b7280',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!liked) e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!liked) e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Like message"
        >
          <motion.div
            animate={{ 
              scale: liked ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <ThumbsUp size={16} fill={liked ? '#93c5fd' : 'none'} />
          </motion.div>
        </motion.button>
        
        <motion.button
          onClick={handleDislike}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: disliked ? '#fef7f7' : 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: disliked ? '#ef4444' : '#6b7280',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disliked) e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disliked) e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Dislike message"
        >
          <motion.div
            animate={{ 
              scale: disliked ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <ThumbsDown size={16} fill={disliked ? '#fca5a5' : 'none'} />
          </motion.div>
        </motion.button>
        
        <span
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginLeft: '8px',
          }}
        >
          {formatTime(message.timestamp)}
        </span>
      </motion.div>
    </motion.div>
  );
};