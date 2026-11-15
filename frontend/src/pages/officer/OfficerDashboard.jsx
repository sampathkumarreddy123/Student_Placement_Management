import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  Award,
  UserCheck,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Layers,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  MapPin,
  CheckCircle,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';
import { getImageUrl } from '../../utils/imageUrl';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  if (diffInSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await studentService.getOfficerDashboard();
      setDashboardData(res);
    } catch (err) {
      console.error('Failed to load officer dashboard:', err);
      setError(err.message || 'Failed to retrieve dashboard operations and analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Retrieving live placement analytics, applicant metrics & drives..." />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentDrives = dashboardData?.recentDrives || [];
  const recentApplications = dashboardData?.recentApplications || [];
  const analytics = dashboardData?.analytics || {};
  const recentActivity = dashboardData?.recentActivity || [];

  // Top statistics items for 6 KPI Cards
  const kpiCards = [
    {
      id: 'students',
      label: 'Registered Students',
      value: stats.totalStudents || 0,
      subtext: 'Enrolled candidates',
      icon: Users,
      bgColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
      to: '/officer/students',
    },
    {
      id: 'companies',
      label: 'Partner Companies',
      value: stats.totalCompanies || 0,
      subtext: 'Recruiting employers',
      icon: Building2,
      bgColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
      to: '/officer/companies',
    },
    {
      id: 'drives',
      label: 'Active Placement Drives',
      value: stats.activeDrives || 0,
      subtext: `${stats.totalDrives || 0} scheduled in total`,
      icon: Briefcase,
      bgColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
      to: '/officer/drives',
    },
    {
      id: 'applications',
      label: 'Total Applications',
      value: stats.totalApplications || 0,
      subtext: 'Student applications filed',
      icon: FileText,
      bgColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
      to: '/officer/applications',
    },
    {
      id: 'selected',
      label: 'Students Selected',
      value: stats.selectedStudents || 0,
      subtext: `${stats.placementRate || 0}% overall placement rate`,
      icon: Award,
      bgColor: 'bg-[#0D9488]/15 text-[#0D9488] border-[#0D9488]/30',
      to: '/officer/applications?status=Selected',
    },
    {
      id: 'shortlisted',
      label: 'Students Shortlisted',
      value: stats.shortlistedStudents || 0,
      subtext: 'Advancing in interview rounds',
      icon: UserCheck,
      bgColor: 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30',
      to: '/officer/applications?status=Shortlisted',
    },
  ];

  // Quick Action Buttons
  const quickActions = [
    {
      title: 'Add Company',
      description: 'Register partner employers, POC details & logos',
      icon: Building2,
      to: '/officer/companies?action=new',
      btnText: 'Add New Company',
      color: 'text-[#163A5F] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE]',
    },
    {
      title: 'Create Placement Drive',
      description: 'Define packages, dates, eligibility criteria & rounds',
      icon: PlusCircle,
      to: '/officer/drives?action=new',
      btnText: 'Create Drive',
      color: 'text-[#163A5F] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE]',
    },
    {
      title: 'View Applicants',
      description: 'Screen candidates, update selection rounds & remarks',
      icon: Users,
      to: '/officer/applications',
      btnText: 'Manage Applicants',
      color: 'text-[#163A5F] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE]',
    },
    {
      title: 'Manage Companies',
      description: 'Search, filter, update or archive recruiting partners',
      icon: Layers,
      to: '/officer/companies',
      btnText: 'Explore Directory',
      color: 'text-[#163A5F] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE]',
    },
  ];

  // Colors for Application Status Distribution
  const statusColors = {
    Applied: { bar: 'bg-[#163A5F]', badge: 'bg-[#F0F7FF] text-[#172554]' },
    'Under Review': { bar: 'bg-[#2563EB]', badge: 'bg-[#EFF6FF] text-[#163A5F]' },
    Shortlisted: { bar: 'bg-[#D97706]', badge: 'bg-[#D97706]/10 text-[#D97706]' },
    Interviewing: { bar: 'bg-[#1E4976]', badge: 'bg-[#F0F7FF] text-[#172554]' },
    Selected: { bar: 'bg-[#0D9488]', badge: 'bg-[#0D9488]/15 text-[#0D9488]' },
    Rejected: { bar: 'bg-[#DC2626]', badge: 'bg-[#DC2626]/15 text-[#DC2626]' },
  };

  const applicationsByCompany = analytics.applicationsByCompany || [];
  const maxCompanyApps = applicationsByCompany.length > 0
    ? Math.max(...applicationsByCompany.map((c) => c.count))
    : 1;

  const selectedByDepartment = analytics.selectedByDepartment || [];
  const maxDeptSelections = selectedByDepartment.length > 0
    ? Math.max(...selectedByDepartment.map((d) => d.count))
    : 1;

  const statusDistribution = analytics.statusDistribution || [];
  const totalAppsForDist = stats.totalApplications || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Top Navigation Header & Operations Bar */}
      <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/officer/profile" className="flex-shrink-0 group" title="View & Edit Officer Profile">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] group-hover:border-[#2563EB] flex items-center justify-center text-[#163A5F] font-bold text-xl overflow-hidden shadow-sm transition-all">
                {user?.profilePhoto ? (
                  <img
                    src={getImageUrl(user.profilePhoto)}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(user?.name || 'O').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#163A5F] border border-[#DBEAFE]">
                  Placement Cell Administration
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-xs text-[#64748B] font-medium">Academic Year 2025–2026</span>
              </div>
              <h1 className="text-2xl font-bold text-[#172554] tracking-tight">
                Welcome, {user?.name || 'Placement Officer'}
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
                Live institutional dashboard tracking corporate recruitment drives, applicant progression,
                and department-level placement performance.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={refreshing}
              onClick={() => fetchDashboard(true)}
              title="Fetch latest data from database"
            >
              {refreshing ? 'Updating...' : 'Refresh Data'}
            </Button>
            <Link to="/officer/profile">
              <Button variant="outline" size="sm" icon={User}>
                Profile
              </Button>
            </Link>
            <Link to="/officer/reports">
              <Button variant="outline" size="sm" icon={BarChart3}>
                Reports
              </Button>
            </Link>
            <Link to="/officer/companies?action=new">
              <Button variant="outline" size="sm" icon={Building2}>
                Add Company
              </Button>
            </Link>
            <Link to="/officer/drives?action=new">
              <Button size="sm" icon={PlusCircle}>
                Create Drive
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: DASHBOARD STATISTICS (6 KPI Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
            Operational Metrics & Institutional KPIs
          </h2>
          <span className="text-[11px] text-[#64748B]">Strictly verified from MongoDB</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.id}
                to={kpi.to}
                className="bg-white rounded-xl border border-[#DBEAFE] hover:border-[#2563EB]/50 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${kpi.bgColor} transition-transform group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#2563EB] group-hover:text-[#172554] transition-colors" />
                </div>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold text-[#172554] tracking-tight">
                    {kpi.value.toLocaleString()}
                  </h3>
                  <p className="text-xs font-semibold text-[#172554] mt-0.5 truncate">
                    {kpi.label}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                    {kpi.subtext}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: QUICK ACTIONS PANEL */}
      <div className="bg-[#F0F7FF] rounded-2xl border border-[#DBEAFE] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              Quick Administrative Actions
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Common administrative workflows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.title}
                className="bg-white p-4 rounded-xl border border-[#DBEAFE] shadow-sm flex flex-col justify-between hover:border-[#2563EB]/50 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-[#172554] text-xs sm:text-sm">
                      {act.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                    {act.description}
                  </p>
                </div>
                <Link to={act.to} className="w-full">
                  <button
                    type="button"
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${act.color}`}
                  >
                    <span>{act.btnText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: PLACEMENT ANALYTICS (4 Visual Charts) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              Placement Analytics & Distribution Charts
            </h2>
          </div>
          <span className="text-[11px] text-[#64748B]">Visual corporate & departmental insights</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CHART 1: Applications by Company */}
          <Card
            title="Applications by Company"
            subtitle="Recruiters attracting the highest candidate engagement"
            action={
              <Link to="/officer/applications" className="text-xs text-[#2563EB] font-medium hover:underline flex items-center gap-1">
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {applicationsByCompany.length > 0 ? (
              <div className="space-y-3.5 mt-1">
                {applicationsByCompany.map((comp) => {
                  const percentage = Math.round((comp.count / maxCompanyApps) * 100);
                  return (
                    <div key={comp.companyId || comp.companyName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div className="w-5 h-5 rounded bg-[#EFF6FF] border border-[#DBEAFE] text-[#163A5F] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {comp.companyName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#172554] truncate" title={comp.companyName}>
                            {comp.companyName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {comp.selected > 0 && (
                            <span className="text-[10px] bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/25 px-1.5 py-0.2 rounded font-medium">
                              {comp.selected} placed
                            </span>
                          )}
                          <span className="font-bold text-[#172554]">{comp.count} apps</span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-2.5 bg-[#F0F7FF] border border-[#DBEAFE] rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No company applications submitted yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Applications will appear here once candidates submit applications for drives.
                </p>
              </div>
            )}
          </Card>

          {/* CHART 2: Selected Students by Department */}
          <Card
            title="Selected Students by Department"
            subtitle="Campus hiring distribution across engineering branches"
            action={
              <Link to="/officer/students" className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline flex items-center gap-1">
                <span>Student Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {selectedByDepartment.length > 0 ? (
              <div className="space-y-3.5 mt-1">
                {selectedByDepartment.map((dept) => {
                  const percentage = Math.round((dept.count / maxDeptSelections) * 100);

                  return (
                    <div key={dept.department} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#172554] truncate pr-2">
                          {dept.department}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-bold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded text-xs border border-[#0D9488]/20">
                            {dept.count} {dept.count === 1 ? 'offer' : 'offers'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-[#F0F7FF] border border-[#DBEAFE] rounded-full overflow-hidden">
                        <div
                          className="bg-[#163A5F] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-[#64748B]">
                <Award className="w-8 h-8 mx-auto text-[#2563EB]/40 mb-2" />
                <p className="text-xs font-medium text-[#172554]">No student selections recorded yet</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Update candidate status to "Selected" in the Applications module to see branch conversions.
                </p>
              </div>
            )}
          </Card>

          {/* CHART 3: Application Status Distribution */}
          <Card
            title="Application Status Distribution"
            subtitle="Pipeline conversion across review and interview stages"
            action={
              <Link to="/officer/applications" className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline flex items-center gap-1">
                <span>Review All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {statusDistribution.length > 0 ? (
              <div className="space-y-4 mt-1">
                {/* Visual Segmented Progress Bar */}
                <div className="w-full h-3.5 bg-[#F0F7FF] border border-[#DBEAFE] rounded-full overflow-hidden flex shadow-inner">
                  {statusDistribution.map((s) => {
                    const widthPercent = (s.count / totalAppsForDist) * 100;
                    const styling = statusColors[s.status] || { bar: 'bg-[#2563EB]' };
                    return (
                      <div
                        key={s.status}
                        className={`${styling.bar} h-full transition-all`}
                        style={{ width: `${widthPercent}%` }}
                        title={`${s.status}: ${s.count} (${widthPercent.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Status Badges with Counts & Percentages */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {statusDistribution.map((s) => {
                    const pct = ((s.count / totalAppsForDist) * 100).toFixed(1);
                    const styling = statusColors[s.status] || { badge: 'bg-[#F0F7FF] text-[#172554]' };
                    return (
                      <div
                        key={s.status}
                        className="p-2.5 rounded-xl border border-[#DBEAFE] bg-[#F0F7FF] flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[#DBEAFE] ${styling.badge}`}>
                            {s.status}
                          </span>
                          <span className="text-[11px] font-bold text-[#172554]">{s.count}</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] mt-1">{pct}% of pipeline</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#64748B]">
                <PieChart className="w-8 h-8 mx-auto text-[#2563EB]/40 mb-2" />
                <p className="text-xs font-medium text-[#172554]">No applications in pipeline</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Pipeline distribution will populate as applications are submitted and evaluated.
                </p>
              </div>
            )}
          </Card>

          {/* CHART 4: Placement Drive Statistics & Package Metrics */}
          <Card
            title="Placement Drive Statistics & Compensation"
            subtitle="Package bands and recruitment drive progress"
            action={
              <Link to="/officer/drives" className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline flex items-center gap-1">
                <span>Drives Manager</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-4 mt-1">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
                  <span className="text-[10px] font-medium text-[#163A5F] block uppercase tracking-wide">
                    Average Package
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#172554] mt-0.5 block">
                    {formatLPA(analytics.driveStats?.avgPackage)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F0F7FF] border border-[#DBEAFE]">
                  <span className="text-[10px] font-medium text-[#0D9488] block uppercase tracking-wide">
                    Highest Package
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#172554] mt-0.5 block">
                    {formatLPA(analytics.driveStats?.maxPackage)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
                  <span className="text-[10px] font-medium text-[#163A5F] block uppercase tracking-wide">
                    Total Drives
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#172554] mt-0.5 block">
                    {stats.totalDrives || 0}
                  </span>
                </div>
              </div>

              {/* Status Breakdown of Drives */}
              <div>
                <p className="text-xs font-semibold text-[#172554] mb-2">Drive Status Breakdown</p>
                {analytics.driveStats?.byStatus?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analytics.driveStats.byStatus.map((d) => (
                      <div
                        key={d.status}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DBEAFE] bg-white text-xs"
                      >
                        <Badge status={d.status} size="sm" />
                        <span className="font-bold text-[#172554]">{d.count} drives</span>
                        {d.avgPackage > 0 && (
                          <span className="text-[11px] text-[#64748B]">({formatLPA(d.avgPackage)})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">No placement drives found in database.</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 5: RECENT PLACEMENT DRIVES */}
      <Card
        title="Recent Placement Drives"
        subtitle="Latest campus recruitment drives scheduled by the placement cell"
        action={
          <div className="flex items-center gap-3">
            <Link to="/officer/drives?action=new">
              <Button size="sm" variant="outline" icon={PlusCircle}>
                New Drive
              </Button>
            </Link>
            <Link to="/officer/drives" className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline flex items-center gap-1">
              <span>View All Drives</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      >
        {recentDrives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DBEAFE] text-[#64748B] font-medium">
                  <th className="pb-3 pl-1">Company & Role</th>
                  <th className="pb-3">Package / CTC</th>
                  <th className="pb-3">Application Deadline</th>
                  <th className="pb-3 text-center">Applicants</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]">
                {recentDrives.map((drive) => {
                  const deadlineInfo = getDeadlineStatus(drive.applicationClosingDate);
                  return (
                    <tr key={drive._id} className="hover:bg-[#F0F7FF] transition-colors">
                      <td className="py-3 pl-1">
                        <div className="flex items-center gap-2.5">
                          {drive.company?.logoUrl ? (
                            <img
                              src={drive.company.logoUrl}
                              alt={drive.company?.name || 'Company'}
                              className="w-8 h-8 rounded-lg object-contain p-0.5 border border-[#DBEAFE] bg-white flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-xs flex-shrink-0">
                              {drive.company?.name ? drive.company.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[#172554] truncate">
                              {drive.company?.name || 'Company'}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">{drive.jobRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-[#172554]">
                        {formatLPA(drive.packageLPA)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col text-[#64748B]">
                          <span>{formatDate(drive.applicationClosingDate)}</span>
                          <span
                            className={`text-[10px] font-medium ${
                              deadlineInfo.isUrgent ? 'text-[#D97706]' : deadlineInfo.isClosed ? 'text-[#DC2626]' : 'text-[#64748B]'
                            }`}
                          >
                            {deadlineInfo.text}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Link
                          to={`/officer/applications?driveId=${drive._id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#163A5F] hover:underline bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2 py-0.5 rounded-full text-xs"
                        >
                          <Users className="w-3 h-3 text-[#2563EB]" />
                          <span>{drive.applicantCount || 0}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-center">
                        <Badge status={drive.status} size="sm" />
                      </td>
                      <td className="py-3 pr-1 text-right">
                        <Link
                          to={`/officer/drives`}
                          className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-[#64748B]">
            <Briefcase className="w-10 h-10 mx-auto text-[#2563EB]/40 mb-2" />
            <p className="text-sm font-semibold text-[#172554]">No placement drives created yet</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Schedule your first corporate placement drive with defined packages, eligibility criteria, and assessment rounds.
            </p>
            <Link to="/officer/drives?action=new" className="inline-block mt-4">
              <Button size="sm" icon={PlusCircle}>
                Schedule First Drive
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* SECTION 6: RECENT APPLICATIONS & RECENT ACTIVITY (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT APPLICATIONS (2 Columns) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Student Applications"
            subtitle="Latest candidate submissions across campus recruitment drives"
            action={
              <Link to="/officer/applications" className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline flex items-center gap-1">
                <span>All Applications ({stats.totalApplications || 0})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {recentApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DBEAFE] text-[#64748B] font-medium">
                      <th className="pb-3 pl-1">Student Candidate</th>
                      <th className="pb-3">Applied Company & Role</th>
                      <th className="pb-3">Applied Date</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right pr-1">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DBEAFE]">
                    {recentApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-[#F0F7FF] transition-colors">
                        <td className="py-3 pl-1">
                          <div>
                            <p className="font-semibold text-[#172554]">{app.studentName}</p>
                            <p className="text-[11px] text-[#64748B] font-mono">
                              {app.rollNumber} • {app.department}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-[#172554]">{app.companyName}</p>
                          <p className="text-[11px] text-[#64748B]">{app.jobRole}</p>
                        </td>
                        <td className="py-3 text-[#64748B]">
                          {formatDate(app.appliedAt)}
                        </td>
                        <td className="py-3 text-center">
                          <Badge status={app.status} size="sm" />
                        </td>
                        <td className="py-3 pr-1 text-right">
                          <Link
                            to={`/officer/applications`}
                            className="text-xs text-[#2563EB] hover:text-[#163A5F] font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <span>Review</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-[#64748B]">
                <FileText className="w-10 h-10 mx-auto text-[#2563EB]/40 mb-2" />
                <p className="text-sm font-semibold text-[#172554]">No applications received yet</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  When eligible students apply for active placement drives, their submissions and evaluation statuses will appear here.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* RECENT ACTIVITY TIMELINE (1 Column) */}
        <div>
          <Card
            title="Recent Officer Activity"
            subtitle="Audit log of administrative operations"
          >
            {recentActivity.length > 0 ? (
              <div className="space-y-4 mt-1">
                {recentActivity.map((act) => {
                  let Icon = Activity;
                  let iconBg = 'bg-[#F0F7FF] text-[#172554] border-[#DBEAFE]';

                  if (act.type === 'company_added') {
                    Icon = Building2;
                    iconBg = 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]';
                  } else if (act.type === 'drive_created') {
                    Icon = PlusCircle;
                    iconBg = 'bg-[#EFF6FF] text-[#163A5F] border-[#DBEAFE]';
                  } else if (act.type === 'status_updated') {
                    Icon = CheckCircle2;
                    iconBg = 'bg-[#0D9488]/15 text-[#0D9488] border-[#0D9488]/30';
                  } else if (act.type === 'drive_closed') {
                    Icon = Clock;
                    iconBg = 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30';
                  }

                  return (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className={`p-1.5 rounded-lg border flex-shrink-0 mt-0.5 ${iconBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#172554] leading-snug truncate">
                            {act.title}
                          </p>
                          <span className="text-[10px] text-[#64748B] flex-shrink-0">
                            {formatRelativeTime(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                          {act.description}
                        </p>
                        {act.link && (
                          <Link
                            to={act.link}
                            className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:text-[#163A5F] hover:underline mt-1 font-medium"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-[#64748B]">
                <Activity className="w-8 h-8 mx-auto text-[#2563EB]/40 mb-2" />
                <p className="text-xs font-semibold text-[#172554]">No recent officer activity</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Activities like scheduling drives, adding companies, and status updates will be logged here automatically.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
