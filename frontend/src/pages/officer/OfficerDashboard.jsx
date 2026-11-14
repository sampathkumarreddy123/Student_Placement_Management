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
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';

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
      bgColor: 'bg-[#F1E7D9] text-[#76543D] border-[#E8DED2]',
      to: '/officer/students',
    },
    {
      id: 'companies',
      label: 'Partner Companies',
      value: stats.totalCompanies || 0,
      subtext: 'Recruiting employers',
      icon: Building2,
      bgColor: 'bg-[#F1E7D9] text-[#76543D] border-[#E8DED2]',
      to: '/officer/companies',
    },
    {
      id: 'drives',
      label: 'Active Placement Drives',
      value: stats.activeDrives || 0,
      subtext: `${stats.totalDrives || 0} scheduled in total`,
      icon: Briefcase,
      bgColor: 'bg-[#F1E7D9] text-[#76543D] border-[#E8DED2]',
      to: '/officer/drives',
    },
    {
      id: 'applications',
      label: 'Total Applications',
      value: stats.totalApplications || 0,
      subtext: 'Student applications filed',
      icon: FileText,
      bgColor: 'bg-[#F1E7D9] text-[#76543D] border-[#E8DED2]',
      to: '/officer/applications',
    },
    {
      id: 'selected',
      label: 'Students Selected',
      value: stats.selectedStudents || 0,
      subtext: `${stats.placementRate || 0}% overall placement rate`,
      icon: Award,
      bgColor: 'bg-[#27845B]/15 text-[#27845B] border-[#27845B]/30',
      to: '/officer/applications?status=Selected',
    },
    {
      id: 'shortlisted',
      label: 'Students Shortlisted',
      value: stats.shortlistedStudents || 0,
      subtext: 'Advancing in interview rounds',
      icon: UserCheck,
      bgColor: 'bg-[#C58A32]/15 text-[#C58A32] border-[#C58A32]/30',
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
      color: 'text-[#44352D] bg-[#F1E7D9] hover:bg-[#E8DED2] border border-[#E8DED2]',
    },
    {
      title: 'Create Placement Drive',
      description: 'Define packages, dates, eligibility criteria & rounds',
      icon: PlusCircle,
      to: '/officer/drives?action=new',
      btnText: 'Create Drive',
      color: 'text-[#44352D] bg-[#F1E7D9] hover:bg-[#E8DED2] border border-[#E8DED2]',
    },
    {
      title: 'View Applicants',
      description: 'Screen candidates, update selection rounds & remarks',
      icon: Users,
      to: '/officer/applications',
      btnText: 'Manage Applicants',
      color: 'text-[#44352D] bg-[#F1E7D9] hover:bg-[#E8DED2] border border-[#E8DED2]',
    },
    {
      title: 'Manage Companies',
      description: 'Search, filter, update or archive recruiting partners',
      icon: Layers,
      to: '/officer/companies',
      btnText: 'Explore Directory',
      color: 'text-[#44352D] bg-[#F1E7D9] hover:bg-[#E8DED2] border border-[#E8DED2]',
    },
  ];

  // Colors for Application Status Distribution
  const statusColors = {
    Applied: { bar: 'bg-[#A17C5B]', badge: 'bg-[#FAF8F4] text-[#44352D]' },
    'Under Review': { bar: 'bg-[#76543D]', badge: 'bg-[#F1E7D9] text-[#44352D]' },
    Shortlisted: { bar: 'bg-[#C58A32]', badge: 'bg-[#C58A32]/10 text-[#C58A32]' },
    Interviewing: { bar: 'bg-[#76543D]', badge: 'bg-[#FAF8F4] text-[#44352D]' },
    Selected: { bar: 'bg-[#27845B]', badge: 'bg-[#27845B]/15 text-[#27845B]' },
    Rejected: { bar: 'bg-[#C94C4C]', badge: 'bg-[#C94C4C]/15 text-[#C94C4C]' },
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1E7D9] text-[#44352D] border border-[#E8DED2]">
                Placement Cell Administration
              </span>
              <span className="text-xs text-[#82776C]">•</span>
              <span className="text-xs text-[#82776C] font-medium">Academic Year 2025–2026</span>
            </div>
            <h1 className="text-2xl font-bold text-[#44352D] tracking-tight">
              Placement Officer Operations
            </h1>
            <p className="text-xs text-[#82776C] mt-1 max-w-2xl">
              Live institutional dashboard tracking corporate recruitment drives, applicant progression,
              and department-level placement performance from MongoDB.
            </p>
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
            <Link to="/officer/companies?action=new">
              <Button variant="outline" size="sm" icon={Building2}>
                Add Company
              </Button>
            </Link>
            <Link to="/officer/drives?action=new">
              <Button size="sm" icon={PlusCircle}>
                Create Placement Drive
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[#C94C4C]/10 border border-[#C94C4C]/25 rounded-xl text-xs text-[#C94C4C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: DASHBOARD STATISTICS (6 KPI Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-[#44352D] uppercase tracking-wider">
            Operational Metrics & Institutional KPIs
          </h2>
          <span className="text-[11px] text-[#82776C]">Strictly verified from MongoDB</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.id}
                to={kpi.to}
                className="bg-white rounded-xl border border-[#E8DED2] hover:border-[#A17C5B]/50 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${kpi.bgColor} transition-transform group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A17C5B] group-hover:text-[#44352D] transition-colors" />
                </div>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold text-[#44352D] tracking-tight">
                    {kpi.value.toLocaleString()}
                  </h3>
                  <p className="text-xs font-semibold text-[#44352D] mt-0.5 truncate">
                    {kpi.label}
                  </p>
                  <p className="text-[11px] text-[#82776C] mt-0.5 truncate">
                    {kpi.subtext}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: QUICK ACTIONS PANEL */}
      <div className="bg-[#FAF8F4] rounded-2xl border border-[#E8DED2] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#76543D]" />
            <h3 className="text-xs font-bold text-[#44352D] uppercase tracking-wider">
              Quick Administrative Actions
            </h3>
          </div>
          <span className="text-[11px] text-[#82776C]">Common administrative workflows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.title}
                className="bg-white p-4 rounded-xl border border-[#E8DED2] shadow-sm flex flex-col justify-between hover:border-[#A17C5B]/50 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-lg bg-[#F1E7D9] text-[#76543D]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-[#44352D] text-xs sm:text-sm">
                      {act.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#82776C] leading-relaxed mb-3">
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
            <BarChart3 className="w-4 h-4 text-[#76543D]" />
            <h2 className="text-xs font-bold text-[#44352D] uppercase tracking-wider">
              Placement Analytics & Distribution Charts
            </h2>
          </div>
          <span className="text-[11px] text-[#82776C]">Visual corporate & departmental insights</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CHART 1: Applications by Company */}
          <Card
            title="Applications by Company"
            subtitle="Recruiters attracting the highest candidate engagement"
            action={
              <Link to="/officer/applications" className="text-xs text-[#76543D] font-medium hover:underline flex items-center gap-1">
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
                          <div className="w-5 h-5 rounded bg-[#F1E7D9] border border-[#E8DED2] text-[#44352D] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {comp.companyName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#44352D] truncate" title={comp.companyName}>
                            {comp.companyName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {comp.selected > 0 && (
                            <span className="text-[10px] bg-[#27845B]/10 text-[#27845B] border border-[#27845B]/25 px-1.5 py-0.2 rounded font-medium">
                              {comp.selected} placed
                            </span>
                          )}
                          <span className="font-bold text-[#44352D]">{comp.count} apps</span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-2.5 bg-[#FAF8F4] border border-[#E8DED2] rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#76543D] h-full rounded-full transition-all duration-500"
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
              <Link to="/officer/students" className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline flex items-center gap-1">
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
                        <span className="font-semibold text-[#44352D] truncate pr-2">
                          {dept.department}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-bold text-[#27845B] bg-[#27845B]/10 px-2 py-0.5 rounded text-xs border border-[#27845B]/20">
                            {dept.count} {dept.count === 1 ? 'offer' : 'offers'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-[#FAF8F4] border border-[#E8DED2] rounded-full overflow-hidden">
                        <div
                          className="bg-[#A17C5B] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-[#82776C]">
                <Award className="w-8 h-8 mx-auto text-[#A17C5B]/50 mb-2" />
                <p className="text-xs font-medium text-[#44352D]">No student selections recorded yet</p>
                <p className="text-[11px] text-[#82776C] mt-0.5">
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
              <Link to="/officer/applications" className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline flex items-center gap-1">
                <span>Review All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {statusDistribution.length > 0 ? (
              <div className="space-y-4 mt-1">
                {/* Visual Segmented Progress Bar */}
                <div className="w-full h-3.5 bg-[#FAF8F4] border border-[#E8DED2] rounded-full overflow-hidden flex shadow-inner">
                  {statusDistribution.map((s) => {
                    const widthPercent = (s.count / totalAppsForDist) * 100;
                    const styling = statusColors[s.status] || { bar: 'bg-[#A17C5B]' };
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
                    const styling = statusColors[s.status] || { badge: 'bg-[#FAF8F4] text-[#44352D]' };
                    return (
                      <div
                        key={s.status}
                        className="p-2.5 rounded-xl border border-[#E8DED2] bg-[#FAF8F4] flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[#E8DED2] ${styling.badge}`}>
                            {s.status}
                          </span>
                          <span className="text-[11px] font-bold text-[#44352D]">{s.count}</span>
                        </div>
                        <span className="text-[10px] text-[#82776C] mt-1">{pct}% of pipeline</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#82776C]">
                <PieChart className="w-8 h-8 mx-auto text-[#A17C5B]/50 mb-2" />
                <p className="text-xs font-medium text-[#44352D]">No applications in pipeline</p>
                <p className="text-[11px] text-[#82776C] mt-0.5">
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
              <Link to="/officer/drives" className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline flex items-center gap-1">
                <span>Drives Manager</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-4 mt-1">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#F1E7D9] border border-[#E8DED2]">
                  <span className="text-[10px] font-medium text-[#76543D] block uppercase tracking-wide">
                    Average Package
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#44352D] mt-0.5 block">
                    {formatLPA(analytics.driveStats?.avgPackage)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E8DED2]">
                  <span className="text-[10px] font-medium text-[#27845B] block uppercase tracking-wide">
                    Highest Package
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#44352D] mt-0.5 block">
                    {formatLPA(analytics.driveStats?.maxPackage)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F0E8] border border-[#E8DED2]">
                  <span className="text-[10px] font-medium text-[#76543D] block uppercase tracking-wide">
                    Total Drives
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#44352D] mt-0.5 block">
                    {stats.totalDrives || 0}
                  </span>
                </div>
              </div>

              {/* Status Breakdown of Drives */}
              <div>
                <p className="text-xs font-semibold text-[#44352D] mb-2">Drive Status Breakdown</p>
                {analytics.driveStats?.byStatus?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analytics.driveStats.byStatus.map((d) => (
                      <div
                        key={d.status}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DED2] bg-white text-xs"
                      >
                        <Badge status={d.status} size="sm" />
                        <span className="font-bold text-[#44352D]">{d.count} drives</span>
                        {d.avgPackage > 0 && (
                          <span className="text-[11px] text-[#82776C]">({formatLPA(d.avgPackage)})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#82776C]">No placement drives found in database.</p>
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
            <Link to="/officer/drives" className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline flex items-center gap-1">
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
                <tr className="border-b border-[#E8DED2] text-[#82776C] font-medium">
                  <th className="pb-3 pl-1">Company & Role</th>
                  <th className="pb-3">Package / CTC</th>
                  <th className="pb-3">Application Deadline</th>
                  <th className="pb-3 text-center">Applicants</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DED2]">
                {recentDrives.map((drive) => {
                  const deadlineInfo = getDeadlineStatus(drive.applicationClosingDate);
                  return (
                    <tr key={drive._id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3 pl-1">
                        <div className="flex items-center gap-2.5">
                          {drive.company?.logoUrl ? (
                            <img
                              src={drive.company.logoUrl}
                              alt={drive.company?.name || 'Company'}
                              className="w-8 h-8 rounded-lg object-contain p-0.5 border border-[#E8DED2] bg-white flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#F1E7D9] border border-[#E8DED2] flex items-center justify-center text-[#44352D] font-bold text-xs flex-shrink-0">
                              {drive.company?.name ? drive.company.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[#44352D] truncate">
                              {drive.company?.name || 'Company'}
                            </p>
                            <p className="text-[11px] text-[#82776C] truncate">{drive.jobRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-[#44352D]">
                        {formatLPA(drive.packageLPA)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col text-[#82776C]">
                          <span>{formatDate(drive.applicationClosingDate)}</span>
                          <span
                            className={`text-[10px] font-medium ${
                              deadlineInfo.isUrgent ? 'text-[#C58A32]' : deadlineInfo.isClosed ? 'text-[#C94C4C]' : 'text-[#82776C]'
                            }`}
                          >
                            {deadlineInfo.text}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Link
                          to={`/officer/applications?driveId=${drive._id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#44352D] hover:underline bg-[#F1E7D9] hover:bg-[#E8DED2] px-2 py-0.5 rounded-full text-xs"
                        >
                          <Users className="w-3 h-3 text-[#76543D]" />
                          <span>{drive.applicantCount || 0}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-center">
                        <Badge status={drive.status} size="sm" />
                      </td>
                      <td className="py-3 pr-1 text-right">
                        <Link
                          to={`/officer/drives`}
                          className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline inline-flex items-center gap-1"
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
          <div className="py-10 text-center text-[#82776C]">
            <Briefcase className="w-10 h-10 mx-auto text-[#A17C5B]/50 mb-2" />
            <p className="text-sm font-semibold text-[#44352D]">No placement drives created yet</p>
            <p className="text-xs text-[#82776C] mt-1 max-w-sm mx-auto">
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
              <Link to="/officer/applications" className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline flex items-center gap-1">
                <span>All Applications ({stats.totalApplications || 0})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {recentApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8DED2] text-[#82776C] font-medium">
                      <th className="pb-3 pl-1">Student Candidate</th>
                      <th className="pb-3">Applied Company & Role</th>
                      <th className="pb-3">Applied Date</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right pr-1">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DED2]">
                    {recentApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-[#FAF8F4] transition-colors">
                        <td className="py-3 pl-1">
                          <div>
                            <p className="font-semibold text-[#44352D]">{app.studentName}</p>
                            <p className="text-[11px] text-[#82776C] font-mono">
                              {app.rollNumber} • {app.department}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-[#44352D]">{app.companyName}</p>
                          <p className="text-[11px] text-[#82776C]">{app.jobRole}</p>
                        </td>
                        <td className="py-3 text-[#82776C]">
                          {formatDate(app.appliedAt)}
                        </td>
                        <td className="py-3 text-center">
                          <Badge status={app.status} size="sm" />
                        </td>
                        <td className="py-3 pr-1 text-right">
                          <Link
                            to={`/officer/applications`}
                            className="text-xs text-[#76543D] hover:text-[#44352D] font-medium hover:underline inline-flex items-center gap-1"
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
              <div className="py-10 text-center text-[#82776C]">
                <FileText className="w-10 h-10 mx-auto text-[#A17C5B]/50 mb-2" />
                <p className="text-sm font-semibold text-[#44352D]">No applications received yet</p>
                <p className="text-xs text-[#82776C] mt-1 max-w-sm mx-auto">
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
                  let iconBg = 'bg-[#FAF8F4] text-[#44352D] border-[#E8DED2]';

                  if (act.type === 'company_added') {
                    Icon = Building2;
                    iconBg = 'bg-[#F1E7D9] text-[#76543D] border-[#E8DED2]';
                  } else if (act.type === 'drive_created') {
                    Icon = PlusCircle;
                    iconBg = 'bg-[#F1E7D9] text-[#44352D] border-[#E8DED2]';
                  } else if (act.type === 'status_updated') {
                    Icon = CheckCircle2;
                    iconBg = 'bg-[#27845B]/15 text-[#27845B] border-[#27845B]/30';
                  } else if (act.type === 'drive_closed') {
                    Icon = Clock;
                    iconBg = 'bg-[#C94C4C]/15 text-[#C94C4C] border-[#C94C4C]/30';
                  }

                  return (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className={`p-1.5 rounded-lg border flex-shrink-0 mt-0.5 ${iconBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#44352D] leading-snug truncate">
                            {act.title}
                          </p>
                          <span className="text-[10px] text-[#82776C] flex-shrink-0">
                            {formatRelativeTime(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#82776C] leading-tight mt-0.5">
                          {act.description}
                        </p>
                        {act.link && (
                          <Link
                            to={act.link}
                            className="inline-flex items-center gap-1 text-[11px] text-[#76543D] hover:text-[#44352D] hover:underline mt-1 font-medium"
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
              <div className="py-10 text-center text-[#82776C]">
                <Activity className="w-8 h-8 mx-auto text-[#A17C5B]/50 mb-2" />
                <p className="text-xs font-semibold text-[#44352D]">No recent officer activity</p>
                <p className="text-[11px] text-[#82776C] mt-0.5">
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
