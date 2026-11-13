import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const EligibilityBadge = ({ isEligible, reasons = [], showDetails = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isEligible) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Eligible
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Not Eligible
        <Info className="w-3 h-3 opacity-70" />
      </button>

      {(isOpen || showDetails) && reasons.length > 0 && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-left">
          <p className="text-xs font-semibold text-slate-900 mb-1.5">
            Eligibility Requirements Not Met:
          </p>
          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
            {reasons.map((reason, idx) => (
              <li key={idx} className="leading-tight">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EligibilityBadge;

