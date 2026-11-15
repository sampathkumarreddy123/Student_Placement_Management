import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[#172554] text-white hover:bg-[#0f172a] focus:ring-[#172554] shadow-sm',
    secondary:
      'bg-[#EFF6FF] text-[#172554] hover:bg-[#DBEAFE] focus:ring-[#172554] border border-[#DBEAFE]',
    navy:
      'bg-[#172554] text-white hover:bg-[#0f172a] focus:ring-[#172554] shadow-sm',
    warm:
      'bg-[#172554] text-white hover:bg-[#0f172a] focus:ring-[#172554] shadow-sm',
    outline:
      'bg-white border border-[#DBEAFE] text-[#172554] hover:bg-[#F0F7FF] hover:border-[#172554]/40 focus:ring-[#172554]',
    danger:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626] shadow-sm',
    ghost:
      'bg-transparent text-[#172554] hover:bg-[#EFF6FF] hover:text-[#0f172a] focus:ring-[#172554]',
    success:
      'bg-[#0D9488] text-white hover:bg-[#0F766E] focus:ring-[#0D9488] shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
