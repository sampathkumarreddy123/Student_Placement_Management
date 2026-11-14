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
      'bg-[#44352D] text-white hover:bg-[#342822] focus:ring-[#76543D] shadow-sm',
    secondary:
      'bg-[#F1E7D9] text-[#44352D] hover:bg-[#E5D6C3] focus:ring-[#A17C5B] border border-[#E8DED2]',
    warm:
      'bg-[#76543D] text-white hover:bg-[#644632] focus:ring-[#76543D] shadow-sm',
    outline:
      'bg-transparent border border-[#E8DED2] text-[#44352D] hover:bg-[#FAF8F4] hover:text-[#44352D] focus:ring-[#A17C5B]',
    danger:
      'bg-[#C94C4C] text-white hover:bg-[#B33E3E] focus:ring-[#C94C4C] shadow-sm',
    ghost:
      'bg-transparent text-[#76543D] hover:bg-[#F6F0E8] hover:text-[#44352D] focus:ring-[#A17C5B]',
    success:
      'bg-[#27845B] text-white hover:bg-[#206F4C] focus:ring-[#27845B] shadow-sm',
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

