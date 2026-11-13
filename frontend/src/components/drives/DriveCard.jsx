import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';
import Badge from '../common/Badge';
import EligibilityBadge from './EligibilityBadge';
import Button from '../common/Button';

const DriveCard = ({ drive, isOfficer = false, onApply, applying = false }) => {
  const deadlineInfo = getDeadlineStatus(drive.registrationDeadline);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-300 transition-all shadow-sm hover:shadow-md p-5 flex flex-col justify-between">
      <div>
        {/* Header: Company & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
              {drive.company?.name ? drive.company.name.charAt(0) : 'C'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base leading-tight hover:text-blue-600 transition-colors">
                <Link to={`/drives/${drive._id}`}>{drive.title}</Link>
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{drive.company?.name || 'Company'}</span>
                <span>•</span>
                <span>{drive.company?.industry || 'Technology'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge status={drive.status} size="sm" />
            {!isOfficer && drive.isEligible !== undefined && (
              <EligibilityBadge
                isEligible={drive.isEligible}
                reasons={drive.eligibilityReasons}
              />
            )}
          </div>
        </div>

        {/* Highlights: Role, Package, Location */}
        <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Role</span>
            <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5 truncate">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              {drive.jobRole}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Package</span>
            <span className="font-semibold text-blue-700 mt-0.5 block">
              {formatLPA(drive.packageLPA)}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {drive.location || 'Multiple'}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-slate-400 block text-[11px]">Min CGPA</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {drive.eligibilityCriteria?.minCgpa ?? 'No limit'}
            </span>
          </div>
        </div>

        {/* Drive & Deadline dates */}
        <div className="flex items-center justify-between text-xs text-slate-500 py-1 border-t border-slate-100 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Drive: {formatDate(drive.driveDate)}</span>
          </div>

          <div
            className={`flex items-center gap-1 font-medium ${
              deadlineInfo.isUrgent
                ? 'text-amber-600'
                : deadlineInfo.isClosed
                ? 'text-rose-600'
                : 'text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{deadlineInfo.text}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <Link to={`/drives/${drive._id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Details
          </Button>
        </Link>

        {isOfficer ? (
          <Link to={`/officer/applications?driveId=${drive._id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              Applicants ({drive.applicantCount ?? 0})
            </Button>
          </Link>
        ) : drive.userApplicationStatus ? (
          <div className="flex-1 text-center">
            <Badge status={drive.userApplicationStatus} size="sm" />
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            disabled={!drive.isEligible || deadlineInfo.isClosed}
            isLoading={applying}
            onClick={() => onApply && onApply(drive._id)}
          >
            Apply Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default DriveCard;

