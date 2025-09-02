import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogCloseProps {
  className?: string;
  onClick?: () => void;
}

// Main Dialog component
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { onOpenChange } as any);
            }
            return child;
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Dialog Content
export function DialogContent({ children, className = '', style, ...props }: DialogContentProps & { onOpenChange?: (open: boolean) => void }) {
  return (
    <motion.div
      className={`modal-content ${className}`}
      style={{
        backgroundColor: 'var(--background-primary)',
        borderRadius: 'var(--border-radius-xl)',
        padding: 'var(--spacing-xl)',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        margin: 'var(--spacing-md)',
        width: '100%',
        ...style,
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.3,
      }}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Dialog Header
export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div 
      style={{
        marginBottom: 'var(--spacing-lg)',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

// Dialog Title
export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2
      className={className}
      style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 var(--spacing-sm) 0',
        lineHeight: '1.2',
      }}
    >
      {children}
    </h2>
  );
}

// Dialog Description
export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return (
    <p
      className={className}
      style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        margin: '0',
        lineHeight: '1.5',
      }}
    >
      {children}
    </p>
  );
}

// Dialog Close Button
export function DialogClose({ className = '', onClick }: DialogCloseProps) {
  return (
    <button
      className={`modal-close ${className}`}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 'var(--spacing-md)',
        right: 'var(--spacing-md)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        padding: 'var(--spacing-sm)',
        borderRadius: 'var(--border-radius-md)',
        transition: 'all var(--transition-normal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-muted)';
      }}
      aria-label="Close dialog"
    >
      <X size={16} />
    </button>
  );
}