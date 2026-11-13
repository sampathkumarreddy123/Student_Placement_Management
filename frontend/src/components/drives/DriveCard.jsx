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
      <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 transition-all shadow-sm hover:shadow-md p-5 flex flex-col justify-between">
        <div>
          {/* ROW 1: Company Logo & Details (Left) + Badges (Right) */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              {drive.company?.logoUrl ? (
                <img
                  src={drive.company.logoUrl}
                  alt={drive.company?.name || 'Company'}
                  className="w-10 h-10 rounded-xl object-contain p-1 border border-slate-200 bg-white flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
              {(!drive.company?.logoUrl || undefined) && (
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
                  {drive.company?.name ? drive.company.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-xs truncate leading-tight">
                  {drive.company?.name || 'Company'}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
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
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug hover:text-blue-600 transition-colors my-3 min-h-[2.5rem] flex items-center">
            <Link to={`/drives/${drive._id}`} className="line-clamp-2">
              {drive.title}
            </Link>
          </h3>

          {/* ROW 3: Highlights Grid (Job Role, Package, Location, CGPA) */}
          <div className="grid grid-cols-2 gap-2.5 my-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Job Role</span>
              <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5 truncate">
                <Briefcase className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="truncate" title={drive.jobRole}>{drive.jobRole}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Package / CTC</span>
              <span className="font-bold text-blue-700 mt-0.5 block truncate">
                {formatLPA(drive.packageLPA)}
              </span>
            </div>

            <div className="mt-0.5">
              <span className="text-slate-400 block text-[11px]">Location</span>
              <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={drive.location}>{drive.location || 'Multiple'}</span>
              </span>
            </div>

            <div className="mt-0.5">
              <span className="text-slate-400 block text-[11px]">Required CGPA</span>
              <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{drive.eligibilityCriteria?.minCgpa ? `${drive.eligibilityCriteria.minCgpa}+ CGPA` : 'No cutoff'}</span>
              </span>
            </div>
          </div>

          {/* ROW 4: Drive Date & Deadline Status */}
          <div className="flex items-center justify-between text-xs text-slate-500 py-1.5 px-0.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Drive: {formatDate(drive.driveDate || drive.applicationClosingDate)}</span>
            </div>

            <div
              className={`flex items-center gap-1 font-medium ${
                deadlineInfo.isUrgent
                  ? 'text-amber-600'
                  : deadlineInfo.isClosed || isClosedStatus
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isClosedStatus ? 'Applications Closed' : deadlineInfo.text}</span>
            </div>
          </div>
        </div>

        {/* ROW 5: Action Buttons (Equal width, clean border) */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
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
