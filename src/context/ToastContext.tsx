'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeConfig = {
  success: { icon: CheckCircle, color: 'var(--color-success)' },
  error: { icon: XCircle, color: 'var(--color-error)' },
  info: { icon: Info, color: 'var(--color-info)' },
  warning: { icon: AlertTriangle, color: 'var(--color-warning)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type }];
      if (newToasts.length > 5) {
        return newToasts.slice(newToasts.length - 5);
      }
      return newToasts;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = typeConfig[toast.type].icon;
            const color = typeConfig[toast.type].color;
            return (
              <motion.div
                key={toast.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  background: 'var(--surface-solid, #ffffff)',
                  border: '1px solid',
                  borderColor: color,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-md, 16px)',
                  padding: '16px',
                  maxWidth: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontFamily: 'var(--font-body)',
                  boxShadow: 'var(--shadow-soft, 0 4px 12px rgba(0,0,0,0.1))',
                  color: 'var(--text-primary, #111827)',
                }}
              >
                <Icon size={24} color={color} />
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    color: 'var(--text-secondary, #6B7280)',
                  }}
                >
                  <X size={18} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
