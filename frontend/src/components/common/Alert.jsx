import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

const Alert = ({
  type = 'info',
  title,
  message,
  children,
  onClose,
  className = '',
}) => {
  const types = {
    info: {
      bg: 'bg-blue-50/80 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
    },
    error: {
      bg: 'bg-rose-50/80 border-rose-200 text-rose-900',
      icon: XCircle,
      iconColor: 'text-rose-600',
    },
  };

  const current = types[type] || types.info;
  const Icon = current.icon;

  return (
    <div
      className={`rounded-lg border p-4 flex items-start gap-3 text-sm ${current.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        {message && <p className="text-xs leading-relaxed opacity-90">{message}</p>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

