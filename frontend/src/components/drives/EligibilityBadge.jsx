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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300">
          <CheckCircle2 className="w-3 h-3 text-slate-700" />
          Eligible
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="text-[11px] text-slate-700 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-0.5"
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
        <AlertTriangle className="w-3 h-3 text-stone-500" />
        Not Eligible
      </span>
      {onViewDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="text-[11px] text-stone-700 hover:text-stone-900 font-medium hover:underline inline-flex items-center gap-0.5"
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
