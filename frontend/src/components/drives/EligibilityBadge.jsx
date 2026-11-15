import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const EligibilityBadge = ({
  isEligible,
  onViewDetails,
  className = '',
}) => {
  if (isEligible) {
    return (
      <button
        type="button"
        onClick={(e) => {
          if (onViewDetails) {
            e.stopPropagation();
            onViewDetails();
          }
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30 hover:bg-[#0D9488]/20 transition-colors ${className}`}
        title="Eligible • Click to view evaluation details"
      >
        <CheckCircle2 className="w-3 h-3 text-[#0D9488]" />
        <span>Eligible</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        if (onViewDetails) {
          e.stopPropagation();
          onViewDetails();
        }
      }}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 hover:bg-[#DC2626]/20 transition-colors ${className}`}
      title="Not Eligible • Click to view criteria breakdown"
    >
      <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
      <span>Not Eligible</span>
    </button>
  );
};

export default EligibilityBadge;
