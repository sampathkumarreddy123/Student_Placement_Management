import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Sparkles,
  Bell,
  Award,
  ChevronRight,
  UserCheck,
  Calendar,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { driveService } from '../../services/driveService';
import { applicationService } from '../../services/applicationService';
import { studentService } from '../../services/studentService';
import { notificationService } from '../../services/notificationService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import DriveCard from '../../components/drives/DriveCard';
import ApplyConfirmModal from '../../components/drives/ApplyConfirmModal';
import {
  StatsCardSkeleton,
  DriveCardSkeleton,
  TableSkeleton,
} from '../../components/common/Skeleton';
import { formatDate, formatLPA } from '../../utils/formatters';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState({ percentage: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedDriveForApply, setSelectedDriveForApply] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Notification Drawer / Popover
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes, profileRes, notifsRes] = await Promise.all([
        driveService.getAllDrives(),
        applicationService.getMyApplications(),
        studentService.getMyProfile(),
        notificationService.getNotifications({ limit: 6 }).catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);

      setDrives(drivesRes.drives || []);
      setApplications(appsRes.applications || []);
      if (profileRes.completion) {
        setProfileCompletion(profileRes.completion);
      }
      if (notifsRes) {
        setNotifications(notifsRes.notifications || []);
        setUnreadCount(notifsRes.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApplyClick = (driveId) => {
    const d = drives.find((item) => item._id === driveId);
    if (d) {
      setSelectedDriveForApply(d);
      setIsApplyModalOpen(true);
    }
  };

  const handleApplySuccess = (res) => {
    setActionMessage({
      type: 'success',
      text: res.message || 'Application submitted successfully!',
    });
    fetchDashboardData();
  };

  const handleNotificationItemClick = async (item) => {
    try {
      if (!item.isRead) {
        await notificationService.markAsRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNotificationsOpen(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Statistics
  const availableDrivesCount = drives.length;
  const eligibleCompaniesCount = drives.filter((d) => d.isEligible).length;
  const applicationsSubmittedCount = applications.length;
  const selectedCompaniesCount = applications.filter((a) => a.status === 'Selected').length;

  return (
    <div className="space-y-6">
      {/* 1. TOP DASHBOARD OVERVIEW SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
        {/* Left: Welcome & Student Overview */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <Badge
              variant={selectedCompaniesCount > 0 ? 'success' : 'primary'}
              size="sm"
            >
              {selectedCompaniesCount > 0 ? 'Placed' : 'Seeking Placement'}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-700">Academic Year 2025–2026</span>
            <span>•</span>
            <span>Campus Placement Portal</span>
          </p>
        </div>

        {/* Right: Profile Completion & Notification Bell */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Profile Completion Indicator */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 px-4 py-2 rounded-xl">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-3">
                <span className="text-[11px] font-medium text-slate-500">Profile Completion</span>
                <span className="text-xs font-bold text-blue-700">
                  {profileCompletion.percentage}%
                </span>
              </div>
              <div className="w-28 sm:w-36 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profileCompletion.percentage === 100
                      ? 'bg-slate-700'
                      : profileCompletion.percentage >= 60
                      ? 'bg-slate-800'
                      : 'bg-stone-500'
                  }`}
                  style={{ width: `${profileCompletion.percentage}%` }}
                />
              </div>
            </div>

            <Link
              to="/student/profile"
              className="text-[11px] font-semibold text-slate-800 hover:text-black hover:underline flex-shrink-0"
            >
              Update
            </Link>
          </div>

          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-sm focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-semibold text-slate-800">
                        Placement Notifications
                      </h3>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-slate-700 hover:text-slate-900 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No new notifications right now.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item._id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors ${
                            item.isRead ? 'opacity-70' : 'bg-slate-50'
                          }`}
                        >
                          <Link
                            to={item.link || '/student/applications'}
                            onClick={() => handleNotificationItemClick(item)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-semibold text-slate-900">
                                {item.title}
                              </h4>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-slate-800 flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              {item.message}
                            </p>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs text-slate-800 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View All Notifications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {actionMessage && (
        <Alert
          type={actionMessage.type}
          message={actionMessage.text}
          onClose={() => setActionMessage(null)}
        />
      )}

      {/* 2. STATISTICS CARDS (4 KPIs) */}
      {loading ? (
        <StatsCardSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Available Placement Drives
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {availableDrivesCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Eligible Companies
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {eligibleCompaniesCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Applications Submitted
                </p>
                <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                  {applicationsSubmittedCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Selected Companies
                </p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">
                  {selectedCompaniesCount}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 3. QUICK ACTIONS BAR */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700">
          Quick Actions:
        </span>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Link to="/student/drives" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" icon={Building2} className="w-full">
              View Companies
            </Button>
          </Link>
          <Link to="/student/applications" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" icon={FileText} className="w-full">
              My Applications
            </Button>
          </Link>
          <Link to="/student/profile" className="flex-1 sm:flex-none">
            <Button variant="primary" size="sm" icon={UserCheck} className="w-full">
              Update Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. PLACEMENT DRIVES SECTION (RECENTLY ADDED DRIVES) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recently Added Placement Drives
            </h2>
            <p className="text-xs text-slate-500">
              Active campus recruitment opportunities matching college criteria
            </p>
          </div>
          <Link
            to="/student/drives"
            className="text-xs font-semibold text-slate-800 hover:text-black flex items-center gap-1"
          >
            View All Companies <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <DriveCardSkeleton />
        ) : drives.length === 0 ? (
          <Card className="text-center py-12">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">
              No placement drives currently active
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              New company recruitment schedules will be announced here once scheduled by the placement officer.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drives.slice(0, 3).map((drive) => (
              <DriveCard
                key={drive._id}
                drive={drive}
                onApply={handleApplyClick}
                applying={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. RECENT APPLICATIONS TABLE SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Application Submissions
            </h2>
            <p className="text-xs text-slate-500">
              Track candidate status progression and selection results
            </p>
          </div>
          <Link
            to="/student/applications"
            className="text-xs font-semibold text-slate-800 hover:text-black flex items-center gap-1"
          >
            View All ({applications.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <Card noPadding>
            <div className="p-4">
              <TableSkeleton />
            </div>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">
              No applications submitted yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Check out the eligible companies above and submit your profile for review.
            </p>
            <div className="mt-4">
              <Link to="/student/drives">
                <Button size="sm" icon={ArrowRight}>
                  Explore Placement Drives
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Job Role</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Application Date</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Officer Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {app.drive?.company?.logoUrl ? (
                            <img
                              src={app.drive.company.logoUrl}
                              alt={app.drive?.company?.name || 'Company'}
                              className="w-8 h-8 rounded-lg object-contain p-0.5 border border-slate-200 bg-white"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {app.drive?.company?.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {app.drive?.company?.name || 'Recruiter'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {app.drive?.company?.industry || 'Technology'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {app.drive?.jobRole || 'Engineer'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-blue-700">
                        {formatLPA(app.drive?.packageLPA)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(app.appliedAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={app.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {app.officerNotes ? (
                          <span className="text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded">
                            {app.officerNotes}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {app.drive?._id && (
                          <Link
                            to={`/drives/${app.drive._id}`}
                            className="text-xs font-semibold text-slate-800 hover:text-black hover:underline"
                          >
                            Details
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Placement Application Confirmation Modal */}
      <ApplyConfirmModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setSelectedDriveForApply(null);
        }}
        drive={selectedDriveForApply}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
};

export default StudentDashboard;
