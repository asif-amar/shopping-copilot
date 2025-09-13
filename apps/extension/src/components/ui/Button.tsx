import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

export function Button({ 
  variant = 'default', 
  size = 'md', 
  children, 
  loading = false,
  disabled,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '500',
    fontSize: 'var(--font-size-sm)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
    textDecoration: 'none',
    fontFamily: 'inherit',
    gap: 'var(--spacing-sm)',
  };

  const variants = {
    default: {
      background: 'linear-gradient(135deg, #642BFE 0%, #9123FF 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(100, 43, 254, 0.3)',
    },
    secondary: {
      background: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary-color)',
      border: '1px solid var(--primary-color)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: 'none',
    },
  };

  const sizes = {
    sm: {
      padding: 'var(--spacing-xs) var(--spacing-md)',
      fontSize: 'var(--font-size-xs)',
      height: '32px',
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      fontSize: 'var(--font-size-sm)',
      height: '40px',
    },
    lg: {
      padding: 'var(--spacing-md) var(--spacing-xl)',
      fontSize: 'var(--font-size-md)',
      height: '48px',
    },
  };

  const isDisabled = disabled || loading;

  const buttonStyles = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    opacity: isDisabled ? 0.6 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    
    const target = e.currentTarget;
    if (variant === 'default') {
      target.style.transform = 'translateY(-1px)';
      target.style.boxShadow = '0 4px 16px rgba(100, 43, 254, 0.4)';
    } else if (variant === 'secondary') {
      target.style.backgroundColor = 'var(--border-light)';
    } else if (variant === 'outline') {
      target.style.backgroundColor = 'rgba(100, 43, 254, 0.1)';
    } else if (variant === 'ghost') {
      target.style.backgroundColor = 'var(--background-secondary)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    
    const target = e.currentTarget;
    if (variant === 'default') {
      target.style.transform = 'translateY(0)';
      target.style.boxShadow = '0 2px 8px rgba(100, 43, 254, 0.3)';
    } else if (variant === 'secondary') {
      target.style.backgroundColor = 'var(--background-secondary)';
    } else if (variant === 'outline') {
      target.style.backgroundColor = 'transparent';
    } else if (variant === 'ghost') {
      target.style.backgroundColor = 'transparent';
    }
  };

  return (
    <motion.button
      className={className}
      style={buttonStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      {...(props as any)}
    >
      {loading && (
        <motion.div
          className="spinner"
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </motion.button>
  );
}