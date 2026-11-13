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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Eligible
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-0.5"
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="w-3 h-3 text-rose-500" />
        Not Eligible
      </span>
      {onViewDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold hover:underline inline-flex items-center gap-0.5"
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
