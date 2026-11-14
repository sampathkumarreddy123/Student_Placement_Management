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
    primary: 'bg-slate-100 text-slate-800 border-slate-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-slate-100 text-slate-800 border-slate-200',
    warning: 'bg-stone-100 text-stone-700 border-stone-200',
    danger: 'bg-stone-100 text-stone-700 border-stone-200',
    purple: 'bg-slate-100 text-slate-800 border-slate-200',
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

