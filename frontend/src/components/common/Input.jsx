import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      required = false,
      showPasswordToggle = false,
      endSlot,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputId = id || props.name;

    const isPasswordType = type === 'password';
    const computedType = isPasswordType
      ? isPasswordVisible
        ? 'text'
        : 'password'
      : type;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#44352D] mb-1.5"
          >
            {label}
            {required && <span className="text-[#C94C4C] ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-4 w-4 text-[#A17C5B]" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={computedType}
            className={`block w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#F6F0E8] disabled:text-[#82776C] ${
              Icon ? 'pl-9' : 'pl-3'
            } ${
              isPasswordType || endSlot ? 'pr-10' : 'pr-3'
            } py-2 ${
              error
                ? 'border-[#C94C4C] text-[#44352D] focus:border-[#C94C4C] focus:ring-[#C94C4C]/20'
                : 'border-[#E8DED2] bg-white text-[#44352D] placeholder-[#82776C]/60 focus:border-[#76543D] focus:ring-[#F1E7D9]'
            } ${className}`}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#82776C] hover:text-[#44352D] focus:outline-none"
              title={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {!isPasswordType && endSlot && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {endSlot}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-[#C94C4C] font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[#82776C]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
