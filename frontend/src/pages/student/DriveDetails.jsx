import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Users,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { driveService } from '../../services/driveService';
import { applicationService } from '../../services/applicationService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';

const DriveDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  const isOfficer = user?.role === 'officer';

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await driveService.getDriveById(id);
      setDrive(res.drive);
    } catch (err) {
      console.error('Failed to load drive details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApply = async () => {
    try {
      setApplying(true);
      setActionAlert(null);
      const res = await applicationService.applyForDrive(drive._id);
      setActionAlert({ type: 'success', text: res.message });
      await fetchDetails();
    } catch (err) {
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to submit application.',
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading placement drive specifications..." />;
  }

  if (!drive) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-600">Drive details could not be found or you do not have permission.</p>
        <Link
          to={isOfficer ? '/officer/drives' : '/student/drives'}
          className="text-xs text-blue-600 hover:underline mt-2 inline-block"
        >
          Return to Drives List
        </Link>
      </div>
    );
  }

  const closingDate = drive.applicationClosingDate || drive.registrationDeadline;
  const deadline = getDeadlineStatus(closingDate);
  const isClosedStatus = drive.status === 'Closed' || drive.status === 'Completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={isOfficer ? '/officer/drives' : '/student/drives'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Drives
        </Link>
      </div>

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Main Drive Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {drive.company?.logoUrl ? (
              <img
                src={drive.company.logoUrl}
                alt={drive.company?.name || 'Company'}
                className="w-14 h-14 rounded-xl object-contain p-1 border border-slate-200 bg-white flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl flex-shrink-0">
                {drive.company?.name ? drive.company.name.charAt(0) : 'C'}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {drive.title}
                </h1>
                <Badge status={drive.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                <span className="font-medium text-slate-700">{drive.company?.name}</span>
                <span>•</span>
                <span>{drive.employmentType || drive.company?.industry || 'Full-Time'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {drive.location}
                </span>
              </p>
            </div>
          </div>

          {/* Action / Application Button */}
          <div className="flex items-center gap-3">
            {isOfficer ? (
              <Link to={`/officer/applications?driveId=${drive._id}`}>
                <Button variant="primary" size="md" icon={Users}>
                  View Applicants ({drive.applicantCount ?? 0})
                </Button>
              </Link>
            ) : drive.userApplication ? (
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block mb-1">Your Application:</span>
                <Badge status={drive.userApplication.status} size="md" />
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={!drive.isEligible || deadline.isClosed || isClosedStatus}
                isLoading={applying}
                onClick={handleApply}
              >
                {isClosedStatus
                  ? 'Applications Closed'
                  : deadline.isClosed
                  ? 'Registration Closed'
                  : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Job Role</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
              {drive.jobRole}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Annual Package (CTC)</span>
            <span className="font-bold text-blue-700 text-sm mt-0.5 block">
              {formatLPA(drive.packageLPA)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Drive / Interview Date</span>
            <span className="font-medium text-slate-700 text-sm mt-0.5 block">
              {formatDate(drive.driveDate || drive.applicationClosingDate)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Application Deadline</span>
            <span
              className={`font-semibold text-sm mt-0.5 block ${
                deadline.isUrgent
                  ? 'text-amber-600'
                  : isClosedStatus || deadline.isClosed
                  ? 'text-rose-600'
                  : 'text-slate-700'
              }`}
            >
              {formatDate(closingDate)} ({isClosedStatus ? 'Closed' : deadline.text})
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Details, Eligibility, Rounds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Description, Skills, Rounds (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Job Role Description">
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {drive.jobDescription || drive.description ||
                'No specific job description provided. Please refer to campus placement guidelines.'}
            </p>

            {/* Required Skills */}
            {drive.requiredSkills && drive.requiredSkills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Required Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {drive.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Selection Process Rounds">
            {drive.rounds && drive.rounds.length > 0 ? (
              <div className="space-y-4">
                {drive.rounds.map((round, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xs flex items-center justify-center">
                        {round.roundNumber || idx + 1}
                      </div>
                      {idx !== drive.rounds.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <h4 className="text-xs font-semibold text-slate-900">
                        {round.roundName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {round.description || 'Evaluation round'}
                      </p>
                      {round.date && (
                        <span className="text-[10px] text-slate-400 mt-1 inline-block">
                          Date: {formatDate(round.date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Selection rounds to be announced.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Eligibility Checklist & Company Card (1 col) */}
        <div className="space-y-6">
          {/* Eligibility Card */}
          <Card
            title="Eligibility Checklist"
            subtitle={!isOfficer && drive.isEligible ? 'You qualify for this drive' : 'Academic Cutoffs'}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Minimum CGPA</span>
                <span className="font-semibold text-slate-900">
                  {drive.eligibilityCriteria?.minCgpa !== undefined
                    ? `${drive.eligibilityCriteria.minCgpa} / 10.0`
                    : 'No minimum cutoff'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Max Active Backlogs</span>
                <span className="font-semibold text-slate-900">
                  {drive.eligibilityCriteria?.maxActiveBacklogs ?? drive.eligibilityCriteria?.maxBacklogs ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Max Total Backlogs</span>
                <span className="font-semibold text-slate-900">
                  {drive.eligibilityCriteria?.maxTotalBacklogs ?? 'Any'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Target Graduation Batch</span>
                <span className="font-semibold text-slate-900">
                  Class of {drive.eligibilityCriteria?.batch || '2026'}
                </span>
              </div>

              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-600 block mb-1">Eligible Departments</span>
                <div className="flex flex-wrap gap-1">
                  {drive.eligibilityCriteria?.allowedDepartments?.map((dept) => (
                    <span
                      key={dept}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                    >
                      {dept}
                    </span>
                  )) || <span className="text-slate-400">All departments</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">10th / 12th Marks</span>
                <span className="font-semibold text-slate-900">
                  {drive.eligibilityCriteria?.minTenthPercentage ?? 60}% /{' '}
                  {drive.eligibilityCriteria?.minTwelfthPercentage ?? 60}%
                </span>
              </div>

              {/* Status banner for students */}
              {!isOfficer && (
                <div
                  className={`p-3 rounded-lg border flex items-start gap-2 mt-4 ${
                    drive.isEligible
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {drive.isEligible ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-xs">
                      {drive.isEligible ? 'You Are Eligible' : 'Eligibility Not Met'}
                    </p>
                    {!drive.isEligible && drive.eligibilityReasons && (
                      <ul className="list-disc pl-4 mt-1 text-[11px] space-y-0.5 opacity-90">
                        {drive.eligibilityReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Company Card */}
          <Card title="About Recruiter">
            <div className="text-xs space-y-2">
              <h4 className="font-semibold text-slate-900">{drive.company?.name}</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {drive.company?.description || 'Corporate recruitment partner.'}
              </p>
              {drive.company?.website && (
                <a
                  href={drive.company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline pt-2 font-medium"
                >
                  Visit Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriveDetails;


