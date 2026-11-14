import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  GraduationCap,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { applicationService } from '../../services/applicationService';
import { useAuth } from '../../hooks/useAuth';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';

const ApplyConfirmModal = ({ isOpen, onClose, drive, onSuccess }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (isOpen && drive) {
      setConfirmed(false);
      setErrorMsg('');
      setLoadingProfile(true);

      studentService
        .getMyProfile()
        .then((res) => {
          if (isMounted) {
            setProfile(res.profile || null);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setErrorMsg(err.message || 'Unable to retrieve your student profile.');
          }
        })
        .finally(() => {
          if (isMounted) setLoadingProfile(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, drive]);

  if (!drive) return null;

  const deadline = getDeadlineStatus(drive.applicationClosingDate || drive.registrationDeadline);
  const isClosedStatus = drive.status === 'Closed' || drive.status === 'Completed';

  // Resolved fields supporting both flat and nested schemas
  const resumeUrl = profile?.resumeUrl || profile?.resume?.fileUrl;
  const resumeOriginalName =
    profile?.resumeOriginalName || profile?.resume?.originalName || 'Uploaded Resume (PDF)';
  const resumeSize = profile?.resumeSize || profile?.resume?.fileSize || 0;
  const rollNumber = profile?.rollNumber || profile?.personal?.rollNumber;
  const department = profile?.department || profile?.academics?.department;
  const cgpa =
    profile?.cgpa !== undefined && profile?.cgpa !== null
      ? profile.cgpa
      : profile?.academics?.currentCgpa;
  const activeBacklogs =
    profile?.activeBacklogs !== undefined
      ? profile.activeBacklogs
      : profile?.academics?.activeBacklogs ?? 0;
  const totalBacklogs =
    profile?.totalBacklogs !== undefined
      ? profile.totalBacklogs
      : profile?.academics?.totalBacklogs ?? 0;

  // Validation checks
  const hasResume = Boolean(resumeUrl);
  const hasRollNumber = Boolean(rollNumber);
  const hasDepartment = Boolean(department);
  const hasCgpa = cgpa !== undefined && cgpa !== null && Number(cgpa) > 0;
  const isProfileComplete = hasResume && hasRollNumber && hasDepartment && hasCgpa;
  const isEmailVerified = Boolean(
    profile?.isEmailVerified !== undefined
      ? profile.isEmailVerified
      : user?.isEmailVerified !== undefined
      ? user.isEmailVerified
      : true
  );

  const canSubmit =
    !loadingProfile &&
    profile &&
    isProfileComplete &&
    isEmailVerified &&
    drive.isEligible !== false &&
    !deadline.isClosed &&
    !isClosedStatus &&
    confirmed &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await applicationService.applyForDrive(drive._id);
      if (onSuccess) {
        onSuccess(res);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Application submission failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Placement Application"
      subtitle={`Review your candidate submission details for ${drive.company?.name || 'Company'}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {errorMsg && (
          <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
        )}

        {/* Email Verification Required Banner */}
        {!isEmailVerified && (
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/90 text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-950">Email Verification Required</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Your college email is not verified yet. Verification is required before you can apply for placement drives.
              </p>
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-1 font-semibold text-slate-900 underline mt-1.5"
              >
                Go to Profile to Verify Email &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Drive Overview Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {drive.company?.logoUrl ? (
              <img
                src={drive.company.logoUrl}
                alt={drive.company?.name}
                className="w-12 h-12 rounded-xl object-contain p-1 border border-slate-200 bg-white flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                {drive.company?.name ? drive.company.name.charAt(0) : 'C'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">{drive.company?.name}</h4>
                <Badge status={drive.status} size="sm" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">{drive.jobRole}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {drive.location || 'Multiple Locations'} • {drive.employmentType || 'Full-Time'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-[11px] text-slate-400 block">Package / CTC</span>
            <span className="text-base font-bold text-blue-700 block">
              {formatLPA(drive.packageLPA)}
            </span>
            <span
              className={`text-[11px] font-medium block mt-0.5 ${
                deadline.isClosed || isClosedStatus ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              {isClosedStatus ? 'Applications Closed' : deadline.text}
            </span>
          </div>
        </div>

        {/* Loading state for student profile */}
        {loadingProfile ? (
          <div className="py-6">
            <LoadingSpinner text="Verifying your student profile and eligibility..." />
          </div>
        ) : !profile ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <p className="font-semibold">Student profile could not be loaded.</p>
            <p className="mt-1">Please ensure your profile is initialized before applying.</p>
          </div>
        ) : (
          <>
            {/* Student Candidate Snapshot Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Your Profile Snapshot to be Submitted
                </span>
                <Link
                  to="/student/profile"
                  target="_blank"
                  className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium"
                >
                  Edit Profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Roll Number</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {rollNumber || <span className="text-rose-500">Missing</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {department || <span className="text-rose-500">Missing</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Current CGPA</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {cgpa !== undefined && cgpa !== null
                      ? `${Number(cgpa).toFixed(2)} / 10`
                      : <span className="text-rose-500">Missing</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Backlogs</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {activeBacklogs} Active / {totalBacklogs} Total
                  </span>
                </div>
              </div>

              {/* Resume Status Card */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${hasResume ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {hasResume ? resumeOriginalName : 'No Resume Uploaded'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {hasResume
                        ? `${resumeSize ? (resumeSize / 1024).toFixed(1) + ' KB' : 'PDF Document'} • Snapshot will be shared with recruiter`
                        : 'A resume is required before submitting applications'}
                    </span>
                  </div>
                </div>

                {hasResume ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Attached
                  </span>
                ) : (
                  <Link to="/student/profile">
                    <Button variant="outline" size="sm">
                      Upload Resume
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Profile Completion Warning */}
            {!isProfileComplete && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Incomplete Profile Information</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your profile is missing required information (such as your resume, roll number, or department).
                    Please update your profile to proceed with this application.
                  </p>
                </div>
              </div>
            )}

            {/* Eligibility Status Alert */}
            {drive.isEligible === false && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Not Eligible for this Drive</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Your academic profile does not meet the eligibility criteria defined by the placement officer for this company.
                  </p>
                  {drive.eligibilityReasons && drive.eligibilityReasons.length > 0 && (
                    <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px]">
                      {drive.eligibilityReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Deadline / Closed Alert */}
            {(deadline.isClosed || isClosedStatus) && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Applications Closed</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    The registration window for this placement drive has ended. New submissions are no longer accepted.
                  </p>
                </div>
              </div>
            )}

            {/* Declaration Checkbox */}
            {isProfileComplete && drive.isEligible !== false && !deadline.isClosed && !isClosedStatus && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    I confirm that the academic details and resume in my profile are accurate and complete.
                    I understand that once submitted, my application cannot be withdrawn or resubmitted.
                  </span>
                </label>
              </div>
            )}
          </>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            isLoading={submitting}
            onClick={handleSubmit}
          >
            Confirm & Submit Application
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplyConfirmModal;
