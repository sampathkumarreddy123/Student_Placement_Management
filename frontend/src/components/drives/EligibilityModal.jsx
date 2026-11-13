import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  GraduationCap,
  ExternalLink,
  Briefcase,
  ChevronRight,
  Info,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatLPA } from '../../utils/formatters';

const EligibilityModal = ({
  isOpen,
  onClose,
  drive,
  onApply,
  applying = false,
}) => {
  if (!drive) return null;

  const isEligible = drive.isEligible;
  const criteriaDetails = drive.eligibilityDetails || [];
  const hasIncompleteProfile = drive.hasIncompleteProfile;
  const missingProfileFields = drive.missingProfileFields || [];
  const reasons = drive.eligibilityReasons || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Eligibility Assessment"
      subtitle={`Drive: ${drive.title} • Recruiter: ${drive.company?.name || 'Company'}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Drive & Role Summary */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {drive.company?.logoUrl ? (
              <img
                src={drive.company.logoUrl}
                alt={drive.company?.name}
                className="w-10 h-10 rounded-lg object-contain p-0.5 border border-slate-200 bg-white"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {drive.company?.name ? drive.company.name.charAt(0) : 'C'}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 text-sm">{drive.title}</p>
              <p className="text-[11px] text-slate-500">
                {drive.company?.name} • Role: {drive.jobRole} • CTC: {formatLPA(drive.packageLPA)}
              </p>
            </div>
          </div>

          <Badge
            variant={isEligible ? 'success' : 'danger'}
            size="md"
          >
            {isEligible ? 'Overall: Eligible' : 'Overall: Not Eligible'}
          </Badge>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isEligible
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          {isEligible ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-xs uppercase tracking-wide">
              {isEligible
                ? 'Candidate Status: Eligible to Apply'
                : 'Candidate Status: Academic Cutoffs Not Met'}
            </h4>
            <p className="text-[11px] leading-relaxed opacity-90">
              {isEligible
                ? 'Congratulations! Your verified academic profile satisfies all 7 eligibility criteria established for this recruitment drive.'
                : 'You currently do not qualify for this placement drive. Please inspect the breakdown below to review which condition(s) did not meet the recruiter cutoff.'}
            </p>
          </div>
        </div>

        {/* Incomplete Profile Alert (if any fields are missing) */}
        {hasIncompleteProfile && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Incomplete Profile Warning</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Missing fields: <span className="font-medium">{missingProfileFields.join(', ')}</span>.
                  Incomplete values may result in an automatic rejection.
                </p>
              </div>
            </div>
            <Link
              to="/student/profile"
              onClick={onClose}
              className="text-[11px] font-bold text-amber-900 hover:underline whitespace-nowrap bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300"
            >
              Update Profile
            </Link>
          </div>
        )}

        {/* Criteria Comparison Table (7 Conditions) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Criteria-by-Criteria Comparison (7 Conditions)
            </span>
            <span className="text-[11px] text-slate-400">
              Evaluated against your official profile records
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[140px]">Condition</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Required Cutoff</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Your Record</th>
                  <th className="py-2.5 px-3 text-center min-w-[70px]">Result</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Evaluation Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteriaDetails.length > 0 ? (
                  criteriaDetails.map((item, idx) => {
                    const isPass = item.status === 'PASS';
                    return (
                      <tr
                        key={idx}
                        className={isPass ? 'hover:bg-slate-50/60' : 'bg-rose-50/30 hover:bg-rose-50/50'}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">
                            #{item.conditionNumber} {item.criterion}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {item.required}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.actual}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-[11px] leading-relaxed">
                          <span
                            className={isPass ? 'text-slate-600' : 'text-rose-700 font-medium'}
                          >
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Criteria details not available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Evaluation
          </Button>

          <div className="flex items-center gap-2">
            {drive.userApplicationStatus ? (
              <Badge status={drive.userApplicationStatus} size="md" />
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={!isEligible}
                isLoading={applying}
                onClick={() => {
                  onClose();
                  if (onApply) onApply(drive._id);
                }}
              >
                {isEligible ? 'Proceed to Apply' : 'Not Eligible to Apply'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EligibilityModal;

