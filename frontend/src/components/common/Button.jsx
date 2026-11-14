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
      'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB] shadow-sm',
    secondary:
      'bg-[#DBEAFE] text-[#163A5F] hover:bg-[#BFDBFE] focus:ring-[#2563EB] border border-[#DBEAFE]',
    navy:
      'bg-[#163A5F] text-white hover:bg-[#0F2843] focus:ring-[#163A5F] shadow-sm',
    warm:
      'bg-[#163A5F] text-white hover:bg-[#0F2843] focus:ring-[#163A5F] shadow-sm',
    outline:
      'bg-white border border-[#DBEAFE] text-[#163A5F] hover:bg-[#F0F7FF] hover:border-[#2563EB]/40 focus:ring-[#2563EB]',
    danger:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626] shadow-sm',
    ghost:
      'bg-transparent text-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#163A5F] focus:ring-[#2563EB]',
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
