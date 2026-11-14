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
      bg: 'bg-[#EFF6FF] border-[#DBEAFE] text-[#163A5F]',
      icon: Info,
      iconColor: 'text-[#2563EB]',
    },
    success: {
      bg: 'bg-[#0D9488]/10 border-[#0D9488]/20 text-[#0D9488]',
      icon: CheckCircle2,
      iconColor: 'text-[#0D9488]',
    },
    warning: {
      bg: 'bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]',
      icon: AlertCircle,
      iconColor: 'text-[#D97706]',
    },
    error: {
      bg: 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]',
      icon: XCircle,
      iconColor: 'text-[#DC2626]',
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
          className="text-[#64748B] hover:text-[#172554] p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
