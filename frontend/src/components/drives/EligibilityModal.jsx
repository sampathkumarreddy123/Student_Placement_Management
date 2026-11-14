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
        <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {drive.company?.logoUrl ? (
              <img
                src={drive.company.logoUrl}
                alt={drive.company?.name}
                className="w-10 h-10 rounded-lg object-contain p-0.5 border border-[#DBEAFE] bg-white"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-sm">
                {drive.company?.name ? drive.company.name.charAt(0) : 'C'}
              </div>
            )}
            <div>
              <p className="font-bold text-[#172554] text-sm">{drive.title}</p>
              <p className="text-[11px] text-[#64748B]">
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
              ? 'bg-[#0D9488]/10 border-[#0D9488]/25 text-[#0D9488]'
              : 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626]'
          }`}
        >
          {isEligible ? (
            <CheckCircle2 className="w-5 h-5 text-[#0D9488] flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-xs uppercase tracking-wide">
              {isEligible
                ? 'Candidate Status: Eligible to Apply'
                : 'Candidate Status: Academic Cutoffs Not Met'}
            </h4>
            <p className="text-[11px] leading-relaxed opacity-95">
              {isEligible
                ? 'Congratulations! Your verified academic profile satisfies all 7 eligibility criteria established for this recruitment drive.'
                : 'You currently do not qualify for this placement drive. Please inspect the breakdown below to review which condition(s) did not meet the recruiter cutoff.'}
            </p>
          </div>
        </div>

        {/* Incomplete Profile Alert (if any fields are missing) */}
        {hasIncompleteProfile && (
          <div className="p-3.5 bg-[#D97706]/10 border border-[#D97706]/30 rounded-xl flex items-start justify-between gap-3 text-[#172554]">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-[#172554]">Incomplete Profile Warning</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Missing fields: <span className="font-medium text-[#172554]">{missingProfileFields.join(', ')}</span>.
                  Incomplete values may result in an automatic rejection.
                </p>
              </div>
            </div>
            <Link
              to="/student/profile"
              onClick={onClose}
              className="text-[11px] font-bold text-[#163A5F] hover:underline whitespace-nowrap bg-[#DBEAFE] px-2.5 py-1 rounded-lg border border-[#DBEAFE]"
            >
              Update Profile
            </Link>
          </div>
        )}

        {/* Criteria Comparison Table (7 Conditions) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#172554] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#2563EB]" />
              Criteria-by-Criteria Comparison (7 Conditions)
            </span>
            <span className="text-[11px] text-[#64748B]">
              Evaluated against your official profile records
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#DBEAFE] shadow-sm">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-[#F0F7FF] border-b border-[#DBEAFE] text-[#172554] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[140px]">Condition</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Required Cutoff</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Your Record</th>
                  <th className="py-2.5 px-3 text-center min-w-[70px]">Result</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Evaluation Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]">
                {criteriaDetails.length > 0 ? (
                  criteriaDetails.map((item, idx) => {
                    const isPass = item.status === 'PASS';
                    return (
                      <tr
                        key={idx}
                        className={isPass ? 'hover:bg-[#F0F7FF]' : 'bg-[#DC2626]/5 hover:bg-[#DC2626]/10'}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#172554] block">
                            #{item.conditionNumber} {item.criterion}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-[#2563EB] font-medium">
                          {item.required}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-[#172554]">
                          {item.actual}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPass
                                ? 'bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30'
                                : 'bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30'
                            }`}
                          >
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-[11px] leading-relaxed">
                          <span
                            className={isPass ? 'text-[#64748B]' : 'text-[#DC2626] font-medium'}
                          >
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#64748B]">
                      Criteria details not available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#DBEAFE]">
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
