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
      className={`bg-white rounded-xl border border-[#E8DED2] shadow-sm overflow-hidden ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-[#E8DED2]/60 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#44352D]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#82776C] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-6'}>{children}</div>

      {footer && (
        <div className="px-6 py-3 bg-[#FAF8F4] border-t border-[#E8DED2]/60 text-sm text-[#82776C]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

