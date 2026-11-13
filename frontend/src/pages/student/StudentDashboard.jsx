import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { driveService } from '../../services/driveService';
import { applicationService } from '../../services/applicationService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DriveCard from '../../components/drives/DriveCard';
import Alert from '../../components/common/Alert';
import { formatDate } from '../../utils/formatters';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [applyingDriveId, setApplyingDriveId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes] = await Promise.all([
        driveService.getAllDrives(),
        applicationService.getMyApplications(),
      ]);
      setDrives(drivesRes.drives || []);
      setApplications(appsRes.applications || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApply = async (driveId) => {
    try {
      setApplyingDriveId(driveId);
      setActionMessage(null);
      const res = await applicationService.applyForDrive(driveId);
      setActionMessage({ type: 'success', text: res.message });
      await fetchDashboardData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to apply. Check eligibility criteria.',
      });
    } finally {
      setApplyingDriveId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your placement dashboard..." />;
  }

  const profile = user?.profile;
  const eligibleDrivesCount = drives.filter((d) => d.isEligible).length;
  const shortlistedCount = applications.filter((a) =>
    ['Shortlisted', 'Interviewing', 'Selected'].includes(a.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome & Profile Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {user?.name}!
            </h1>
            <Badge
              variant={profile?.placementStatus === 'Placed' ? 'success' : 'secondary'}
              size="sm"
            >
              {profile?.placementStatus === 'Placed'
                ? `Placed at ${profile?.placedCompany?.name || 'Company'}`
                : 'Seeking Placement'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Roll No: <span className="font-semibold text-slate-700">{profile?.rollNumber || 'Not set'}</span> •
            Dept: <span className="font-semibold text-slate-700">{profile?.department || 'N/A'}</span> •
            CGPA: <span className="font-semibold text-slate-700">{profile?.cgpa?.toFixed(2) || '0.00'}</span> •
            Batch: <span className="font-semibold text-slate-700">{profile?.batch || '2026'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/student/profile">
            <Button variant="outline" size="sm">
              Edit Academic Profile
            </Button>
          </Link>
          <Link to="/student/drives">
            <Button variant="primary" size="sm" icon={ArrowRight}>
              Browse All Drives
            </Button>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <Alert
          type={actionMessage.type}
          message={actionMessage.text}
          onClose={() => setActionMessage(null)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Active Placement Drives</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{drives.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Drives You Are Eligible For</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{eligibleDrivesCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Applications Submitted</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Shortlisted / Interviewing</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{shortlistedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Upcoming Drives + My Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Drives (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recommended Placement Drives
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by upcoming schedule and eligibility
              </p>
            </div>
            <Link
              to="/student/drives"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all ({drives.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {drives.length === 0 ? (
            <Card className="text-center py-10">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No active drives right now</p>
              <p className="text-xs text-slate-500 mt-0.5">
                New corporate drives will be announced by the placement cell soon.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drives.slice(0, 4).map((drive) => (
                <DriveCard
                  key={drive._id}
                  drive={drive}
                  onApply={handleApply}
                  applying={applyingDriveId === drive._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications Sidebar (1 col) */}
        <div>
          <Card
            title="My Applications"
            subtitle="Recent status changes"
            action={
              <Link
                to="/student/applications"
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                View all
              </Link>
            }
          >
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No applications yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Browse drives and submit your first application.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div
                    key={app._id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                          {app.drive?.company?.name || 'Company'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {app.drive?.jobRole || 'Software Role'}
                        </p>
                      </div>
                      <Badge status={app.status} size="sm" />
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Applied: {formatDate(app.appliedAt)}</span>
                      <span>Round {app.currentRound}</span>
                    </div>

                    {app.officerNotes && (
                      <p className="mt-1.5 text-[11px] text-blue-700 bg-blue-50/60 p-1.5 rounded">
                        Note: {app.officerNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

