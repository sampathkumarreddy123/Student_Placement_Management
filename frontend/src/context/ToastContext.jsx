import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title = 'Success') => addToast({ type: 'success', title, message }),
    [addToast]
  );

  const error = useCallback(
    (message, title = 'Error') => addToast({ type: 'error', title, message, duration: 5000 }),
    [addToast]
  );

  const warning = useCallback(
    (message, title = 'Attention') => addToast({ type: 'warning', title, message }),
    [addToast]
  );

  const info = useCallback(
    (message, title = 'Information') => addToast({ type: 'info', title, message }),
    [addToast]
  );

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#0D9488] flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#2563EB] flex-shrink-0" />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-[#0D9488]/30 bg-white/95';
      case 'error':
        return 'border-[#DC2626]/30 bg-white/95';
      case 'warning':
        return 'border-[#D97706]/30 bg-white/95';
      default:
        return 'border-[#DBEAFE] bg-white/95';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border p-4 shadow-xl backdrop-blur-sm transition-all duration-300 transform translate-y-0 flex items-start gap-3 ${getToastBorder(
              t.type
            )}`}
          >
            {getToastIcon(t.type)}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <h5 className="text-xs font-bold text-[#172554] leading-tight">
                  {t.title}
                </h5>
              )}
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#F0F7FF] transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
