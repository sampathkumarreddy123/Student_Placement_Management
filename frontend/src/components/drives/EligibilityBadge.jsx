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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#27845B]/10 text-[#27845B] border border-[#27845B]/20">
          <CheckCircle2 className="w-3 h-3 text-[#27845B]" />
          Eligible
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="text-[11px] text-[#76543D] hover:text-[#44352D] font-medium hover:underline inline-flex items-center gap-0.5"
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#C94C4C]/10 text-[#C94C4C] border border-[#C94C4C]/20">
        <AlertTriangle className="w-3 h-3 text-[#C94C4C]" />
        Not Eligible
      </span>
      {onViewDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="text-[11px] text-[#76543D] hover:text-[#44352D] font-medium hover:underline inline-flex items-center gap-0.5"
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
