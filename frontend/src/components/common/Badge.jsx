import React from 'react';
import { getStatusColor } from '../../utils/formatters';

const Badge = ({
  children,
  variant,
  status,
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-[#F1E7D9] text-[#44352D] border-[#E8DED2]',
    secondary: 'bg-[#F6F0E8] text-[#76543D] border-[#E8DED2]',
    success: 'bg-[#27845B]/10 text-[#27845B] border-[#27845B]/20',
    warning: 'bg-[#C58A32]/10 text-[#C58A32] border-[#C58A32]/20',
    danger: 'bg-[#C94C4C]/10 text-[#C94C4C] border-[#C94C4C]/20',
    champagne: 'bg-[#F1E7D9] text-[#44352D] border-[#E8DED2]',
    cocoa: 'bg-[#44352D] text-white border-[#44352D]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const colorClass = status
    ? getStatusColor(status)
    : variant
    ? variantStyles[variant]
    : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${colorClass} ${sizes[size]} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;

