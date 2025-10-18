'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'border-accent bg-accent/10 text-accent',
    error: 'border-red-500 bg-red-500/10 text-red-500',
    warning: 'border-retro-amber bg-retro-amber/10 text-retro-amber',
    info: 'border-accent/50 bg-accent/5 text-accent',
  };

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div
        className={`
          min-w-[300px] max-w-md
          border-2 ${typeStyles[type]}
          rounded-lg p-4
          shadow-[0_0_20px_rgba(0,255,255,0.3)]
          backdrop-blur-sm
          font-mono
          relative
          overflow-hidden
        `}
      >
        {/* Animated border glow */}
        <div className="absolute inset-0 border-2 border-accent/20 rounded-lg animate-pulse pointer-events-none"></div>
        
        {/* Content */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-2xl font-bold animate-bounce">
            {icons[type]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg hover:scale-110 transition-transform"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent/20">
          <div
            className={`h-full ${type === 'success' ? 'bg-accent' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-retro-amber' : 'bg-accent/50'}`}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Toast container component for multiple toasts
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
          className="animate-slide-in-right"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
