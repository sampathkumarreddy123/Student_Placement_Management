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

const DriveCard = ({ drive, isOfficer = false, onApply, applying = false }) => {
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const deadlineInfo = getDeadlineStatus(drive.applicationClosingDate || drive.registrationDeadline);
  const isClosedStatus = drive.status === 'Closed' || drive.status === 'Completed';

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E8DED2] hover:border-[#A17C5B]/50 transition-all shadow-sm hover:shadow-md p-5 flex flex-col justify-between">
        <div>
          {/* ROW 1: Company Logo & Details (Left) + Badges (Right) */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E8DED2]">
            <div className="flex items-center gap-3 min-w-0">
              {drive.company?.logoUrl ? (
                <img
                  src={drive.company.logoUrl}
                  alt={drive.company?.name || 'Company'}
                  className="w-10 h-10 rounded-xl object-contain p-1 border border-[#E8DED2] bg-white flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
              {(!drive.company?.logoUrl || undefined) && (
                <div className="w-10 h-10 rounded-xl bg-[#F1E7D9] border border-[#E8DED2] flex items-center justify-center text-[#44352D] font-bold text-base flex-shrink-0">
                  {drive.company?.name ? drive.company.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-[#44352D] text-xs truncate leading-tight">
                  {drive.company?.name || 'Company'}
                </p>
                <p className="text-[11px] text-[#82776C] truncate mt-0.5">
                  {drive.employmentType || drive.company?.industry || 'Full-Time'}
                </p>
              </div>
            </div>

            {/* Badges on Top Right with clean horizontal alignment */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 flex-shrink-0">
              <Badge status={drive.status} size="sm" />
              {!isOfficer && drive.isEligible !== undefined && (
                <EligibilityBadge
                  isEligible={drive.isEligible}
                  onViewDetails={() => setShowEligibilityModal(true)}
                />
              )}
            </div>
          </div>

          {/* ROW 2: Drive Title (Gets 100% full card width, no overlap!) */}
          <h3 className="font-bold text-[#44352D] text-sm sm:text-base leading-snug hover:text-[#76543D] transition-colors my-3 min-h-[2.5rem] flex items-center">
            <Link to={`/drives/${drive._id}`} className="line-clamp-2">
              {drive.title}
            </Link>
          </h3>

          {/* ROW 3: Highlights Grid (Job Role, Package, Location, CGPA) */}
          <div className="grid grid-cols-2 gap-2.5 my-3 p-3 bg-[#FAF8F4] rounded-xl border border-[#E8DED2] text-xs">
            <div>
              <span className="text-[#82776C] block text-[11px]">Job Role</span>
              <span className="font-medium text-[#44352D] flex items-center gap-1.5 mt-0.5 truncate">
                <Briefcase className="w-3.5 h-3.5 text-[#A17C5B] flex-shrink-0" />
                <span className="truncate" title={drive.jobRole}>{drive.jobRole}</span>
              </span>
            </div>

            <div>
              <span className="text-[#82776C] block text-[11px]">Package / CTC</span>
              <span className="font-bold text-[#44352D] mt-0.5 block truncate">
                {formatLPA(drive.packageLPA)}
              </span>
            </div>

            <div className="mt-0.5">
              <span className="text-[#82776C] block text-[11px]">Location</span>
              <span className="font-medium text-[#76543D] flex items-center gap-1.5 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#A17C5B] flex-shrink-0" />
                <span className="truncate" title={drive.location}>{drive.location || 'Multiple'}</span>
              </span>
            </div>

            <div className="mt-0.5">
              <span className="text-[#82776C] block text-[11px]">Required CGPA</span>
              <span className="font-medium text-[#76543D] flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#A17C5B] flex-shrink-0" />
                <span>{drive.eligibilityCriteria?.minCgpa ? `${drive.eligibilityCriteria.minCgpa}+ CGPA` : 'No cutoff'}</span>
              </span>
            </div>
          </div>

          {/* ROW 4: Drive Date & Deadline Status */}
          <div className="flex items-center justify-between text-xs text-[#82776C] py-1.5 px-0.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A17C5B]" />
              <span>Drive: {formatDate(drive.driveDate || drive.applicationClosingDate)}</span>
            </div>

            <div
              className={`flex items-center gap-1 font-medium ${
                deadlineInfo.isUrgent
                  ? 'text-[#C58A32]'
                  : deadlineInfo.isClosed || isClosedStatus
                  ? 'text-[#C94C4C]'
                  : 'text-[#82776C]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isClosedStatus ? 'Applications Closed' : deadlineInfo.text}</span>
            </div>
          </div>
        </div>

        {/* ROW 5: Action Buttons (Equal width, clean border) */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#E8DED2] mt-2">
          <Link to={`/drives/${drive._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </Link>

          {isOfficer ? (
            <Link to={`/officer/applications?driveId=${drive._id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                Applicants ({drive.applicantCount ?? 0})
              </Button>
            </Link>
          ) : drive.userApplicationStatus ? (
            <div className="flex-1 text-center py-1">
              <Badge status={drive.userApplicationStatus} size="sm" />
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={!drive.isEligible || deadlineInfo.isClosed || isClosedStatus}
              isLoading={applying}
              onClick={() => onApply && onApply(drive._id)}
            >
              {isClosedStatus ? 'Closed' : deadlineInfo.isClosed ? 'Expired' : 'Apply Now'}
            </Button>
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
