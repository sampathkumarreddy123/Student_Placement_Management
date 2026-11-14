import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const PageHeader = ({
  title,
  subtitle,
  category,
  badge,
  backTo,
  backLabel = 'Back',
  actions,
  breadcrumbs = [],
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#DBEAFE] shadow-sm p-6 relative overflow-hidden ${className}`}
    >
      {/* Optional Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label || idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#64748B]/50" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-[#2563EB] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-[#172554]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Category Pill / Back Button */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#163A5F] font-medium mr-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{backLabel}</span>
              </Link>
            )}

            {category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DBEAFE] text-[#163A5F] border border-[#DBEAFE]">
                {category}
              </span>
            )}

            {badge && (
              typeof badge === 'string' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  {badge}
                </span>
              ) : badge
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#172554] tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
