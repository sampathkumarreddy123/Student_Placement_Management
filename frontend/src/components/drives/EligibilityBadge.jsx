import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const EligibilityBadge = ({ isEligible, reasons = [], showDetails = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isEligible) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Eligible
      </span>
    );
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap"
        title="Click to view eligibility requirements"
      >
        <AlertTriangle className="w-3 h-3 text-rose-500" />
        <span>Not Eligible</span>
        <Info className="w-3 h-3 text-rose-400" />
      </button>

      {(isOpen || showDetails) && reasons.length > 0 && (
        <>
          {/* Backdrop to close popover when clicking outside */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1.5 z-40 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
              <span className="font-semibold text-slate-800 text-[11px]">
                Eligibility Not Met:
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-3.5">
              {reasons.map((reason, idx) => (
                <li key={idx} className="leading-tight">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default EligibilityBadge;


