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
    primary: 'bg-[#DBEAFE] text-[#163A5F] border-[#DBEAFE]',
    secondary: 'bg-[#F0F7FF] text-[#64748B] border-[#DBEAFE]',
    success: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20',
    warning: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
    danger: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
    accent: 'bg-[#DBEAFE] text-[#2563EB] border-[#DBEAFE] font-medium',
    navy: 'bg-[#163A5F] text-white border-[#163A5F]',
    cocoa: 'bg-[#163A5F] text-white border-[#163A5F]',
    champagne: 'bg-[#DBEAFE] text-[#163A5F] border-[#DBEAFE]',
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
    : 'bg-[#F0F7FF] text-[#64748B] border-[#DBEAFE]';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${colorClass} ${sizes[size]} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
