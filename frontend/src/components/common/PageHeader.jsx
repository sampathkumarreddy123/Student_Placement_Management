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
      className={`bg-white rounded-2xl border border-[#E8DED2] shadow-sm p-6 relative overflow-hidden ${className}`}
    >
      {/* Optional Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[#82776C] mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label || idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#A17C5B]/50" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-[#44352D] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-[#44352D]">{crumb.label}</span>
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
                className="inline-flex items-center gap-1 text-xs text-[#76543D] hover:text-[#44352D] font-medium mr-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{backLabel}</span>
              </Link>
            )}

            {category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1E7D9] text-[#44352D] border border-[#E8DED2]">
                {category}
              </span>
            )}

            {badge && (
              typeof badge === 'string' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F6F0E8] text-[#76543D] border border-[#E8DED2]">
                  {badge}
                </span>
              ) : badge
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#44352D] tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xs sm:text-sm text-[#82776C] mt-1 max-w-2xl leading-relaxed">
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

