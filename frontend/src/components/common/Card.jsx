import React from 'react';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#DBEAFE] shadow-sm overflow-hidden ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-[#DBEAFE]/80 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#172554]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-6'}>{children}</div>

      {footer && (
        <div className="px-6 py-3 bg-[#F0F7FF] border-t border-[#DBEAFE]/80 text-sm text-[#64748B]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
