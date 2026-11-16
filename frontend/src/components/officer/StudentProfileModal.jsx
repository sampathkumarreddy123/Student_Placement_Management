import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  FileText,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Award,
  Calendar,
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { applicationService } from '../../services/applicationService';
import { formatDate, formatLPA } from '../../utils/formatters';
import { getImageUrl, getResumeUrl } from '../../utils/imageUrl';

const StudentProfileModal = ({ isOpen, onClose, studentId, applicationId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && studentId) {
      setLoading(true);
      setError(null);
      studentService
        .getStudentById(studentId)
        .then((res) => {
          if (isMounted) setData(res);
        })
        .catch((err) => {
          if (isMounted) setError(err.message || 'Failed to load student profile.');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const student = data?.student;
  const applications = data?.applications || [];

  const handleDownloadResume = async () => {
    if (!applicationId && !student?._id && !studentId) return;
    try {
      setDownloading(true);
      let response;
      if (applicationId) {
        response = await applicationService.downloadApplicantResume(applicationId);
      } else {
        response = await studentService.downloadStudentResume(student?._id || studentId);
      }

      // Create blob download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        student?.resumeOriginalName ||
        `${(student?.name || 'Student').replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback: if URL exists, open directly via getResumeUrl
      if (student?.resumeUrl) {
        window.open(getResumeUrl(student.resumeUrl), '_blank');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleViewResume = async () => {
    if (!applicationId && !student?._id && !studentId && !student?.resumeUrl) return;
    try {
      setViewing(true);
      let response;
      if (applicationId) {
        response = await applicationService.previewApplicantResume(applicationId);
      } else {
        response = await studentService.previewStudentResume(student?._id || studentId);
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Resume preview failed', err);
      if (student?.resumeUrl) {
        window.open(getResumeUrl(student.resumeUrl), '_blank');
      }
    } finally {
      setViewing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Student Academic Profile"
      subtitle={student ? `${student.name} • Roll No: ${student.rollNumber || 'N/A'}` : 'Candidate Profile Details'}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-8">
          <LoadingSpinner text="Retrieving complete student records and academic credentials..." />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <p className="font-semibold">Unable to load profile</p>
          <p className="mt-0.5">{error}</p>
        </div>
      ) : student ? (
        <div className="space-y-5 text-xs">
          {/* Header Card: Personal Identity */}
          <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#DBEAFE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {student.profilePhoto ? (
                <img
                  src={getImageUrl(student.profilePhoto)}
                  alt={student.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#DBEAFE] shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-xl flex-shrink-0">
                  {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#172554]">{student.name}</h3>
                  <Badge status={student.placementStatus || 'Not Placed'} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-[#64748B] text-[11px]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#2563EB]" /> {student.email}
                  </span>
                  {student.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#2563EB]" /> {student.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-[11px] text-[#64748B] block">Graduation Batch</span>
              <span className="text-sm font-bold text-[#172554] block">
                Class of {student.batch || '2026'}
              </span>
              <span className="font-mono text-xs text-[#163A5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE] mt-1 inline-block">
                {student.rollNumber}
              </span>
            </div>
          </div>

          {/* Academic Credentials Grid */}
          <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
            <h4 className="font-bold text-[#172554] flex items-center gap-1.5 pb-2 border-b border-[#DBEAFE]">
              <GraduationCap className="w-4 h-4 text-[#2563EB]" /> Academic Standing & Cutoff Metrics
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE]">
                <span className="text-[11px] text-[#64748B] block">Current CGPA</span>
                <span className="text-base font-bold text-[#172554] mt-0.5 block">
                  {student.cgpa !== undefined ? `${Number(student.cgpa).toFixed(2)} / 10` : 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE]">
                <span className="text-[11px] text-[#64748B] block">Department / Branch</span>
                <span className="font-semibold text-[#172554] mt-0.5 block truncate" title={student.department}>
                  {student.department || 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE]">
                <span className="text-[11px] text-[#64748B] block">10th Percentage</span>
                <span className="text-sm font-semibold text-[#172554] mt-0.5 block">
                  {student.tenthPercentage ? `${student.tenthPercentage}%` : 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE]">
                <span className="text-[11px] text-[#64748B] block">12th / Inter / Diploma %</span>
                <span className="text-sm font-semibold text-[#172554] mt-0.5 block">
                  {student.twelfthPercentage ? `${student.twelfthPercentage}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Backlogs Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div
                className={`p-2.5 rounded-lg border ${
                  student.activeBacklogs > 0
                    ? 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626]'
                    : 'bg-[#0D9488]/10 border-[#0D9488]/25 text-[#0D9488]'
                }`}
              >
                <span className="text-[11px] block font-medium">Active Backlogs</span>
                <span className="text-sm font-bold mt-0.5 block">
                  {student.activeBacklogs ?? 0} Backlog{student.activeBacklogs === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DBEAFE] text-[#172554]">
                <span className="text-[11px] text-[#64748B] block font-medium">Total Historical Backlogs</span>
                <span className="text-sm font-semibold mt-0.5 block">
                  {student.totalBacklogs ?? 0} Backlog{student.totalBacklogs === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Skills & Portfolio Links */}
          <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
            <h4 className="font-bold text-[#172554] flex items-center gap-1.5 pb-2 border-b border-[#DBEAFE]">
              <Award className="w-4 h-4 text-[#2563EB]" /> Technical Skills & Profiles
            </h4>

            {student.skills && student.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {student.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#163A5F] font-medium text-[11px] border border-[#DBEAFE]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[#64748B] text-xs">No technical skills recorded yet.</p>
            )}

            {/* Links */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              {student.githubUrl && (
                <a
                  href={student.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#163A5F] font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" /> GitHub Profile
                </a>
              )}
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#163A5F] font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>

          {/* Resume Download Box */}
          <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#DBEAFE] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-[#DBEAFE] text-[#163A5F] flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-[#172554] block truncate text-xs">
                  {student.resumeOriginalName || 'Candidate Resume (PDF)'}
                </span>
                <span className="text-[11px] text-[#64748B] block">
                  {student.resumeSize
                    ? `${(student.resumeSize / 1024).toFixed(1)} KB • Verified PDF Document`
                    : 'PDF Resume document available'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                icon={ExternalLink}
                isLoading={viewing}
                onClick={handleViewResume}
                title="Preview candidate resume in a new browser tab"
              >
                Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                isLoading={downloading}
                onClick={handleDownloadResume}
                title="Download candidate resume file"
              >
                Download
              </Button>
            </div>
          </div>

          {/* Past Drive Applications History */}
          <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 space-y-3">
            <h4 className="font-bold text-[#172554] flex items-center justify-between pb-2 border-b border-[#DBEAFE]">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#2563EB]" /> Application History Across Drives
              </span>
              <span className="text-[11px] font-normal text-[#64748B]">
                {applications.length} Drive Submissions
              </span>
            </h4>

            {applications.length === 0 ? (
              <p className="text-[#64748B] text-xs py-2">No other placement applications recorded.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="p-2.5 rounded-lg border border-[#DBEAFE] bg-[#F0F7FF] flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-[#172554] block text-xs">
                        {app.drive?.title || app.company?.name || 'Drive'}
                      </span>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        {app.drive?.jobRole} • Applied {formatDate(app.appliedAt)}
                      </span>
                    </div>
                    <Badge status={app.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end pt-3 border-t border-[#DBEAFE]">
            <Button variant="primary" size="sm" onClick={onClose}>
              Close Profile
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default StudentProfileModal;

