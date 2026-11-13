import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Download,
  GraduationCap,
  ExternalLink,
  MessageSquare,
  Award,
  ShieldCheck,
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatLPA } from '../../utils/formatters';

const ApplicationDetailsModal = ({ isOpen, onClose, application }) => {
  if (!application) return null;

  const company = application.company || application.drive?.company;
  const drive = application.drive;
  const resume = application.resumeSnapshot || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Details"
      subtitle={`Application Reference #${application._id?.slice(-8).toUpperCase()}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Company & Role Summary Header */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company?.name}
                className="w-12 h-12 rounded-xl object-contain p-1 border border-slate-200 bg-white flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                {company?.name ? company.name.charAt(0) : 'C'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">{company?.name || 'Company'}</h4>
                <Badge status={application.status} size="sm" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">{drive?.jobRole || 'Candidate'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {drive?.location || company?.location || 'Campus'} • {drive?.employmentType || 'Full-Time'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-[11px] text-slate-400 block">Package / CTC</span>
            <span className="text-base font-bold text-blue-700 block">
              {formatLPA(drive?.packageLPA)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Applied on {formatDate(application.appliedAt)}
            </span>
          </div>
        </div>

        {/* Current Round & Selection Remarks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-blue-600" /> Current Application Status & Remarks
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Current Stage</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                Round {application.currentRound || 1} • {application.status}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Submission Timestamp</span>
              <span className="font-medium text-slate-700 mt-0.5 block">
                {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>

          {/* Officer remarks / notes */}
          {application.selectionRemarks ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 mt-2">
              <span className="font-semibold block text-[11px] text-emerald-800">
                Placement Cell Remarks
              </span>
              <p className="mt-0.5">{application.selectionRemarks}</p>
            </div>
          ) : application.officerNotes ? (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 mt-2">
              <span className="font-semibold block text-[11px] text-blue-800">Officer Notes</span>
              <p className="mt-0.5">{application.officerNotes}</p>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
              Your application is under evaluation by the recruitment committee. Updates will appear here.
            </div>
          )}
        </div>

        {/* Submitted Profile Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Academic & Resume Snapshot
          </h5>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Roll Number</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {resume.studentRollNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Department</span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {resume.studentDepartment || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">CGPA at Apply</span>
              <span className="font-bold text-blue-600 mt-0.5 block">
                {resume.studentCgpa !== undefined ? `${resume.studentCgpa} / 10` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Resume Snapshot Link */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 block truncate">
                  {resume.resumeOriginalName || 'Submitted Resume (PDF)'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {resume.resumeSize
                    ? `${(resume.resumeSize / 1024).toFixed(1)} KB • Submitted with this application`
                    : 'PDF Snapshot archived with application'}
                </span>
              </div>
            </div>

            {resume.resumeUrl && (
              <a
                href={resume.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 ml-2"
              >
                <Button variant="outline" size="sm" icon={ExternalLink}>
                  View Resume
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {drive?._id && (
            <Link to={`/drives/${drive._id}`}>
              <Button variant="ghost" size="sm" icon={ExternalLink}>
                View Drive Specifications
              </Button>
            </Link>
          )}

          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplicationDetailsModal;
