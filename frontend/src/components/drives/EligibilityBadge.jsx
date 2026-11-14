import React from 'react';
import { CheckCircle2, AlertTriangle, Info, ChevronRight } from 'lucide-react';

const EligibilityBadge = ({
  isEligible,
  onViewDetails,
  className = '',
}) => {
  if (isEligible) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30">
          <CheckCircle2 className="w-3 h-3 text-[#0D9488]" />
          Eligible
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="text-[11px] text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline inline-flex items-center gap-0.5"
            title="View full criteria evaluation"
          >
            <span>Details</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
        <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
        Not Eligible
      </span>
      {onViewDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="text-[11px] text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline inline-flex items-center gap-0.5"
          title="Click to see which criteria failed"
        >
          <span>View Details</span>
          <Info className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default EligibilityBadge;
