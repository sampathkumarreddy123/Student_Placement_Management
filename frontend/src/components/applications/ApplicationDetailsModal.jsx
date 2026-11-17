import React, { useMemo } from 'react';
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
  History,
  ListOrdered,
  CheckCircle2,
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatLPA } from '../../utils/formatters';
import { getImageUrl, getResumeUrl } from '../../utils/imageUrl';
import { applicationService } from '../../services/applicationService';
import {
  generateCandidateResumeBlob,
  downloadBlobFile,
  previewBlobFile,
  isJsonErrorBlob,
} from '../../utils/clientPdfGenerator';

const ApplicationDetailsModal = ({ isOpen, onClose, application }) => {
  if (!application) return null;

  const company = application.company || application.drive?.company;
  const drive = application.drive;
  const resume = application.resumeSnapshot || {};

  const combinedRounds = useMemo(() => {
    const driveRounds = Array.isArray(application.drive?.rounds) ? application.drive.rounds : [];
    const results = Array.isArray(application.roundResults) ? application.roundResults : [];

    if (driveRounds.length > 0) {
      return driveRounds.map((dr, idx) => {
        const roundNum = dr.roundNumber || idx + 1;
        const matchingResult = results.find(
          (r) => r.roundNumber === roundNum || String(r.round) === String(dr._id)
        );

        let status = 'Pending';
        let remarks = dr.description || '';

        if (matchingResult) {
          status = matchingResult.status;
          remarks = matchingResult.remarks || dr.description || '';
        } else if (application.currentRound > roundNum) {
          status = 'Passed';
        } else if (application.status === 'Rejected' && application.currentRound === roundNum) {
          status = 'Failed';
        }

        return {
          roundNumber: roundNum,
          roundName: dr.roundName || dr.name || `Round ${roundNum}`,
          status,
          remarks,
          date: dr.date,
          mode: dr.mode,
          venue: dr.venue,
        };
      });
    }

    return results;
  }, [application]);

  const handleDownloadResume = async () => {
    const candidateName = (application.student?.name || 'Applicant').replace(/\s+/g, '_');
    const filename = resume.resumeOriginalName || `${candidateName}_Resume.pdf`;

    if (application._id) {
      try {
        const response = await applicationService.downloadApplicantResume(application._id);
        const isError = await isJsonErrorBlob(response.data);
        if (!isError && response.data && response.data.size > 100) {
          downloadBlobFile(new Blob([response.data], { type: 'application/pdf' }), filename);
          return;
        }
      } catch (e) {
        console.warn('Backend download failed, generating client fallback:', e);
      }
    }

    const fallbackBlob = generateCandidateResumeBlob({
      name: application.student?.name,
      rollNumber: resume.studentRollNumber,
      department: resume.studentDepartment,
      cgpa: resume.studentCgpa,
      email: application.student?.email,
      skills: resume.skills,
    });
    downloadBlobFile(fallbackBlob, filename);
  };

  const handleViewResume = async () => {
    if (application._id) {
      try {
        const response = await applicationService.previewApplicantResume(application._id);
        const isError = await isJsonErrorBlob(response.data);
        if (!isError && response.data && response.data.size > 100) {
          previewBlobFile(new Blob([response.data], { type: 'application/pdf' }));
          return;
        }
      } catch (e) {
        console.warn('Backend preview failed, generating client fallback:', e);
      }
    }

    const fallbackBlob = generateCandidateResumeBlob({
      name: application.student?.name,
      rollNumber: resume.studentRollNumber,
      department: resume.studentDepartment,
      cgpa: resume.studentCgpa,
      email: application.student?.email,
      skills: resume.skills,
    });
    previewBlobFile(fallbackBlob);
  };

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
        <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#DBEAFE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {company?.logoUrl ? (
              <img
                src={getImageUrl(company.logoUrl)}
                alt={company?.name}
                className="w-12 h-12 rounded-xl object-contain p-1 border border-[#DBEAFE] bg-white flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-lg flex-shrink-0">
                {company?.name ? company.name.charAt(0) : 'C'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#172554] text-sm">{company?.name || 'Company'}</h4>
                <Badge status={application.status} size="sm" />
              </div>
              <p className="text-xs text-[#163A5F] mt-0.5 font-medium">{drive?.jobRole || 'Candidate'}</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {drive?.location || company?.location || 'Campus'} • {drive?.employmentType || 'Full-Time'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-[11px] text-[#64748B] block">Package / CTC</span>
            <span className="text-base font-bold text-[#172554] block">
              {formatLPA(drive?.packageLPA)}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-0.5">
              Applied on {formatDate(application.appliedAt)}
            </span>
          </div>
        </div>

        {/* Current Round & Selection Remarks */}
        <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
          <h5 className="text-xs font-bold text-[#172554] flex items-center gap-1.5 pb-2 border-b border-[#DBEAFE]">
            <Award className="w-4 h-4 text-[#2563EB]" /> Current Application Status & Remarks
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-[#64748B] block">Current Stage</span>
              <span className="font-semibold text-[#172554] mt-0.5 block">
                Round {application.currentRound || 1} • {application.status}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#64748B] block">Submission Timestamp</span>
              <span className="font-medium text-[#163A5F] mt-0.5 block">
                {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>

          {/* Officer remarks / notes */}
          {application.selectionRemarks ? (
            <div className="p-3 bg-[#0D9488]/10 border border-[#0D9488]/25 rounded-lg text-xs text-[#0D9488] mt-2">
              <span className="font-semibold block text-[11px] text-[#0D9488]">
                Placement Cell Remarks
              </span>
              <p className="mt-0.5 text-[#0D9488]/90">{application.selectionRemarks}</p>
            </div>
          ) : application.officerNotes ? (
            <div className="p-3 bg-[#F0F7FF] border border-[#DBEAFE] rounded-lg text-xs text-[#172554] mt-2">
              <span className="font-semibold block text-[11px] text-[#163A5F]">Officer Notes</span>
              <p className="mt-0.5 text-[#172554]">{application.officerNotes}</p>
            </div>
          ) : (
            <div className="p-2.5 bg-[#F0F7FF] rounded-lg border border-[#DBEAFE] text-xs text-[#64748B]">
              Your application is under evaluation by the recruitment committee. Updates will appear here.
            </div>
          )}
        </div>

        {/* Recruitment Round Progression */}
        <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DBEAFE]">
            <h5 className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-[#2563EB]" /> Recruitment Round Progression
            </h5>
            <span className="text-[11px] font-semibold text-[#2563EB]">
              {application.status === 'Selected'
                ? '🎉 Officially Selected'
                : application.status === 'Rejected'
                ? 'Process Concluded'
                : `Currently in Round ${application.currentRound || 1}`}
            </span>
          </div>

          <div className="space-y-2">
            {combinedRounds && combinedRounds.length > 0 ? (
              combinedRounds.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-all ${
                    r.status === 'Passed'
                      ? 'bg-[#0D9488]/5 border-[#0D9488]/30'
                      : r.status === 'Failed'
                      ? 'bg-red-50/50 border-red-200'
                      : 'bg-[#F0F7FF] border-[#DBEAFE]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 ${
                        r.status === 'Passed'
                          ? 'bg-[#0D9488] text-white'
                          : r.status === 'Failed'
                          ? 'bg-red-600 text-white'
                          : 'bg-[#2563EB] text-white'
                      }`}
                    >
                      {r.roundNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#172554]">
                          {r.roundName}
                        </span>
                        {r.mode && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-white border border-[#DBEAFE] text-[#163A5F] font-medium">
                            Mode: {r.mode}
                          </span>
                        )}
                      </div>
                      {r.date && (
                        <p className="text-[11px] text-[#2563EB] font-medium mt-0.5">
                          📅 Scheduled: {formatDate(r.date)}
                        </p>
                      )}
                      {r.venue && (
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          📍 Venue: {r.venue}
                        </p>
                      )}
                      {r.remarks && (
                        <p className="text-[11px] text-[#64748B] mt-0.5 italic">
                          "{r.remarks}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Passed'
                          ? 'bg-[#0D9488]/15 text-[#0D9488]'
                          : r.status === 'Failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status === 'Passed' && '✓ Passed'}
                      {r.status === 'Failed' && '✗ Not Cleared'}
                      {r.status === 'Pending' && '⏳ In Progress / Scheduled'}
                      {r.status === 'Absent' && 'Absent'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#DBEAFE] text-xs text-[#64748B] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                <span>Round-by-round evaluations will appear here as they are conducted.</span>
              </div>
            )}
          </div>
        </div>

        {/* Status History Timeline for Students */}
        {application.statusHistory && application.statusHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
            <h5 className="text-xs font-bold text-[#172554] flex items-center gap-1.5 pb-2 border-b border-[#DBEAFE]">
              <History className="w-4 h-4 text-[#2563EB]" /> Selection Progression History
            </h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {application.statusHistory.slice().reverse().map((hist, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Badge status={hist.previousStatus} size="sm" />
                      <span className="text-[#2563EB]">→</span>
                      <Badge status={hist.newStatus} size="sm" />
                    </div>
                    {hist.remarks && (
                      <p className="text-[#64748B] mt-1 italic">"{hist.remarks}"</p>
                    )}
                  </div>
                  <span className="text-[#64748B] whitespace-nowrap text-[10px]">
                    {formatDate(hist.updatedDate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submitted Profile Snapshot */}
        <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
          <h5 className="text-xs font-bold text-[#172554] flex items-center gap-1.5 pb-2 border-b border-[#DBEAFE]">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Academic & Resume Snapshot
          </h5>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-[#64748B] block">Roll Number</span>
              <span className="font-semibold text-[#172554] mt-0.5 block">
                {resume.studentRollNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#64748B] block">Department</span>
              <span className="font-semibold text-[#172554] mt-0.5 block truncate">
                {resume.studentDepartment || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#64748B] block">CGPA at Apply</span>
              <span className="font-bold text-[#172554] mt-0.5 block">
                {resume.studentCgpa !== undefined ? `${resume.studentCgpa} / 10` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Resume Snapshot Link */}
          <div className="mt-2 pt-2 border-t border-[#DBEAFE] flex items-center justify-between p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-[#DBEAFE] text-[#163A5F] flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#172554] block truncate">
                  {resume.resumeOriginalName || 'Submitted Resume (PDF)'}
                </span>
                <span className="text-[11px] text-[#64748B] block">
                  {resume.resumeSize
                    ? `${(resume.resumeSize / 1024).toFixed(1)} KB • Submitted with this application`
                    : 'PDF Snapshot archived with application'}
                </span>
              </div>
            </div>

            {resume.resumeUrl && (
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={ExternalLink}
                  onClick={handleViewResume}
                  title="Show / Preview Resume in new tab"
                >
                  View Resume
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={handleDownloadResume}
                  title="Download Candidate Resume"
                >
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#DBEAFE]">
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

