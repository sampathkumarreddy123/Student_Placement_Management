import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';
import Badge from '../common/Badge';
import EligibilityBadge from './EligibilityBadge';
import EligibilityModal from './EligibilityModal';
import Button from '../common/Button';
import { getImageUrl } from '../../utils/imageUrl';

const DriveCard = ({ drive, isOfficer = false, onApply, applying = false }) => {
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const deadlineInfo = getDeadlineStatus(drive.applicationClosingDate || drive.registrationDeadline);
  const isClosedStatus = drive.status === 'Closed' || drive.status === 'Completed';

  const companyName = drive.company?.name || (typeof drive.company === 'string' ? drive.company : 'Company');
  const companyInitial = companyName ? companyName.charAt(0).toUpperCase() : 'C';

  return (
    <>
      <div className="bg-white rounded-xl border border-[#DBEAFE] hover:border-[#2563EB]/40 hover:shadow-md transition-all p-5 flex flex-col justify-between group">
        <div>
          {/* Header: Company Avatar/Logo + Name & Single Status/Eligibility Badge */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#DBEAFE]">
            <div className="flex items-center gap-2.5 min-w-0">
              {drive.company?.logoUrl && !imgError ? (
                <img
                  src={getImageUrl(drive.company.logoUrl)}
                  alt={companyName}
                  className="w-9 h-9 rounded-lg object-contain p-0.5 border border-[#DBEAFE] bg-white flex-shrink-0"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-sm flex-shrink-0">
                  {companyInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-xs text-[#172554] truncate leading-tight">
                  {companyName}
                </p>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  {drive.employmentType || drive.company?.industry || 'Full-Time'}
                </p>
              </div>
            </div>

            {/* Clean Single Status or Eligibility Badge */}
            <div className="flex-shrink-0">
              {isOfficer ? (
                <Badge status={drive.status} size="sm" />
              ) : drive.userApplicationStatus ? (
                <Badge status={drive.userApplicationStatus} size="sm" />
              ) : drive.isEligible !== undefined ? (
                <EligibilityBadge
                  isEligible={drive.isEligible}
                  onViewDetails={() => setShowEligibilityModal(true)}
                />
              ) : (
                <Badge status={drive.status} size="sm" />
              )}
            </div>
          </div>

          {/* Drive Title */}
          <h3 className="font-bold text-[#172554] text-base leading-snug group-hover:text-[#2563EB] transition-colors my-3 min-h-[2.5rem] flex items-center">
            <Link to={`/drives/${drive._id}`} className="line-clamp-2">
              {drive.title}
            </Link>
          </h3>

          {/* Highlights: Package & Criteria */}
          <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-[#DBEAFE]/60">
            <div>
              <span className="text-[11px] font-medium text-[#64748B] block">Package (CTC)</span>
              <span className="text-base font-bold text-[#163A5F]">
                {formatLPA(drive.packageLPA)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-[#64748B] block">Min Criteria</span>
              <span className="text-xs font-semibold text-[#172554]">
                {drive.eligibilityCriteria?.minCgpa ? `${drive.eligibilityCriteria.minCgpa}+ CGPA` : 'Open to All'}
              </span>
            </div>
          </div>

          {/* Role & Location Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFF6FF] border border-[#DBEAFE] rounded-md text-[11px] font-medium text-[#163A5F]">
              <Briefcase className="w-3 h-3 text-[#2563EB] flex-shrink-0" />
              <span className="truncate max-w-[130px]" title={drive.jobRole}>{drive.jobRole}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFF6FF] border border-[#DBEAFE] rounded-md text-[11px] font-medium text-[#163A5F]">
              <MapPin className="w-3 h-3 text-[#2563EB] flex-shrink-0" />
              <span className="truncate max-w-[120px]" title={drive.location}>{drive.location || 'Multiple'}</span>
            </span>
          </div>

          {/* Drive Date & Deadline */}
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 pt-1">
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Drive: {formatDate(drive.driveDate || drive.applicationClosingDate)}</span>
            </span>

            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${
                deadlineInfo.isUrgent
                  ? 'text-[#D97706]'
                  : deadlineInfo.isClosed || isClosedStatus
                  ? 'text-[#DC2626]'
                  : 'text-[#64748B]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isClosedStatus ? 'Closed' : deadlineInfo.text}</span>
            </span>
          </div>
        </div>

        {/* Action Button(s) */}
        <div className="pt-3 border-t border-[#DBEAFE] mt-2">
          {isOfficer ? (
            <Link to={`/officer/applications?driveId=${drive._id}`} className="block">
              <Button variant="secondary" size="sm" className="w-full">
                Applicants ({drive.applicantCount ?? 0})
              </Button>
            </Link>
          ) : drive.userApplicationStatus ? (
            <Link to="/student/applications" className="block">
              <Button variant="outline" size="sm" className="w-full">
                View Application Status
              </Button>
            </Link>
          ) : drive.isEligible && !isClosedStatus && !deadlineInfo.isClosed ? (
            <div className="flex gap-2">
              <Link to={`/drives/${drive._id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Details
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                isLoading={applying}
                onClick={() => onApply && onApply(drive._id)}
              >
                Apply Now
              </Button>
            </div>
          ) : (
            <Link to={`/drives/${drive._id}`} className="block">
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Automatic Eligibility Assessment Modal */}
      {!isOfficer && (
        <EligibilityModal
          isOpen={showEligibilityModal}
          onClose={() => setShowEligibilityModal(false)}
          drive={drive}
          onApply={onApply}
          applying={applying}
        />
      )}
    </>
  );
};

export default DriveCard;
