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
      bg: 'bg-[#F6F0E8] border-[#E8DED2] text-[#44352D]',
      icon: Info,
      iconColor: 'text-[#76543D]',
    },
    success: {
      bg: 'bg-[#27845B]/10 border-[#27845B]/20 text-[#27845B]',
      icon: CheckCircle2,
      iconColor: 'text-[#27845B]',
    },
    warning: {
      bg: 'bg-[#C58A32]/10 border-[#C58A32]/20 text-[#C58A32]',
      icon: AlertCircle,
      iconColor: 'text-[#C58A32]',
    },
    error: {
      bg: 'bg-[#C94C4C]/10 border-[#C94C4C]/20 text-[#C94C4C]',
      icon: XCircle,
      iconColor: 'text-[#C94C4C]',
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

