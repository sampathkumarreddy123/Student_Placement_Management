import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  UserCheck,
  Building2,
  Briefcase,
  FileText,
  Award,
  XCircle,
  Download,
  Printer,
  RefreshCw,
  Filter,
  RotateCcw,
  DollarSign,
  CheckCircle2,
  Layers,
  ChevronRight,
  Search,
  ExternalLink,
  GraduationCap,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { companyService } from '../../services/companyService';
import { driveService } from '../../services/driveService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { downloadCsv, printReportDocument } from '../../utils/exportUtils';
import { formatLPA, formatDate } from '../../utils/formatters';

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const ACADEMIC_YEARS = ['All', '2024', '2025', '2026', '2027'];

const APPLICATION_STATUSES = [
  'All',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interviewing',
  'Selected',
  'Rejected',
];

const REPORT_TABS = [
  { id: 'overview', label: 'Summary & Overview', icon: LayoutGridIcon },
  { id: 'department', label: 'Department-Wise', icon: GraduationCap },
  { id: 'company', label: 'Company Selections', icon: Building2 },
  { id: 'batch', label: 'Academic Year', icon: Calendar },
  { id: 'drives', label: 'Drive Applicants', icon: Briefcase },
  { id: 'status', label: 'Application Status', icon: PieChart },
  { id: 'rounds', label: 'Recruitment Rounds', icon: Layers },
  { id: 'salary', label: 'Salary Distribution', icon: DollarSign },
];

function LayoutGridIcon(props) {
  return <BarChart3 {...props} />;
}

const ManageReports = () => {
  const toast = useToast();

  // Active Report Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Filter States
  const [filters, setFilters] = useState({
    academicYear: 'All',
    department: 'All',
    company: 'All',
    drive: 'All',
    status: 'All',
  });

  // Dynamic filter dropdown datasets
  const [companyOptions, setCompanyOptions] = useState([]);
  const [driveOptions, setDriveOptions] = useState([]);

  // Data states
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Search filter for tables
  const [tableSearch, setTableSearch] = useState('');

  // Fetch filter options (Companies & Drives)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [compRes, driveRes] = await Promise.all([
          companyService.getCompanies({ limit: 100 }).catch(() => ({ companies: [] })),
          driveService.getAllDrives({ limit: 100 }).catch(() => ({ drives: [] })),
        ]);
        setCompanyOptions(compRes.companies || compRes.data || []);
        setDriveOptions(driveRes.drives || driveRes.data || []);
      } catch (err) {
        console.warn('Could not load extra filter options', err);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch Statistics & Analytics based on active filters
  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const queryParams = {};
        if (filters.academicYear !== 'All') queryParams.academicYear = filters.academicYear;
        if (filters.department !== 'All') queryParams.department = filters.department;
        if (filters.company !== 'All') queryParams.company = filters.company;
        if (filters.drive !== 'All') queryParams.drive = filters.drive;
        if (filters.status !== 'All') queryParams.status = filters.status;

        const [statsRes, analyticsRes] = await Promise.all([
          reportService.getStatistics(queryParams),
          reportService.getAnalytics(queryParams),
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (analyticsRes.success) {
          setReports(analyticsRes.reports);
        }
      } catch (err) {
        console.error('Failed to load placement reports:', err);
        toast.showError(err.message || 'Failed to load report analytics.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, toast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter change handler
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      academicYear: 'All',
      department: 'All',
      company: 'All',
      drive: 'All',
      status: 'All',
    });
    setTableSearch('');
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== 'All');

  // -------------------------------------------------------------
  // EXPORT HANDLERS
  // -------------------------------------------------------------

  // 1. Export Applicant List
  const handleExportApplicants = async () => {
    try {
      setExportLoading(true);
      const queryParams = {};
      if (filters.academicYear !== 'All') queryParams.academicYear = filters.academicYear;
      if (filters.department !== 'All') queryParams.department = filters.department;
      if (filters.company !== 'All') queryParams.company = filters.company;
      if (filters.drive !== 'All') queryParams.drive = filters.drive;
      if (filters.status !== 'All') queryParams.status = filters.status;

      const res = await reportService.exportApplicants(queryParams);
      if (!res.data || res.data.length === 0) {
        toast.showInfo('No applicant records found for the selected filters.');
        return;
      }

      const headers = [
        'Applicant ID',
        'Student Name',
        'College Email',
        'Roll Number',
        'Department',
        'Batch',
        'CGPA',
        'Company',
        'Job Role',
        'Package',
        'Current Round',
        'Application Status',
        'Applied Date',
        'Officer Remarks',
      ];

      const rows = res.data.map((item) => [
        item.applicantId,
        item.studentName,
        item.collegeEmail,
        item.rollNumber,
        item.department,
        item.batch,
        item.cgpa,
        item.company,
        item.jobRole,
        item.packageLPA,
        item.currentRound,
        item.status,
        item.appliedDate,
        item.officerRemarks,
      ]);

      downloadCsv('MITS_Placement_Applicants_Roster', headers, rows);
      toast.showSuccess(`Exported ${res.data.length} applicant records.`);
    } catch (err) {
      toast.showError('Failed to export applicants.');
    } finally {
      setExportLoading(false);
    }
  };

  // 2. Export Selected / Placed Students List
  const handleExportSelected = async () => {
    try {
      setExportLoading(true);
      const queryParams = {};
      if (filters.academicYear !== 'All') queryParams.academicYear = filters.academicYear;
      if (filters.department !== 'All') queryParams.department = filters.department;
      if (filters.company !== 'All') queryParams.company = filters.company;
      if (filters.drive !== 'All') queryParams.drive = filters.drive;

      const res = await reportService.exportSelected(queryParams);
      if (!res.data || res.data.length === 0) {
        toast.showInfo('No selected candidates found for the selected filters.');
        return;
      }

      const headers = [
        'Selection ID',
        'Student Name',
        'College Email',
        'Roll Number',
        'Department',
        'Batch',
        'CGPA',
        'Placed Company',
        'Job Role',
        'Offered Package',
        'Placed Date',
        'Selection Remarks',
      ];

      const rows = res.data.map((item) => [
        item.selectionId,
        item.studentName,
        item.collegeEmail,
        item.rollNumber,
        item.department,
        item.batch,
        item.cgpa,
        item.placedCompany,
        item.jobRole,
        item.offeredPackage,
        item.placedDate,
        item.selectionRemarks,
      ]);

      downloadCsv('MITS_Selected_Students_Placement_List', headers, rows);
      toast.showSuccess(`Exported ${res.data.length} placed students.`);
    } catch (err) {
      toast.showError('Failed to export placed students.');
    } finally {
      setExportLoading(false);
    }
  };

  // 3. Export Consolidated Multi-Report CSV
  const handleExportConsolidatedReport = () => {
    if (!reports || !stats) {
      toast.showInfo('No data loaded to export.');
      return;
    }

    const headers = [
      'Report Type',
      'Entity Name',
      'Total Count / Candidates',
      'Placed / Passed Count',
      'Rate / Percentage (%)',
      'Average Package (LPA)',
      'Highest Package (LPA)',
      'Additional Metrics',
    ];

    const rows = [];

    // Summary row
    rows.push([
      'Overall Summary',
      'Institution Overall',
      stats.totalRegisteredStudents,
      stats.totalSelectedStudents,
      `${stats.overallPlacementPercentage}%`,
      reports.packageDistributionReport?.metrics?.averagePackage || 0,
      reports.packageDistributionReport?.metrics?.highestPackage || 0,
      `Eligible Rate: ${stats.eligiblePlacementPercentage}% | Drives: ${stats.totalPlacementDrives} | Companies: ${stats.totalCompanies}`,
    ]);

    // Department Report
    reports.departmentReport?.forEach((d) => {
      rows.push([
        'Department Report',
        d.department,
        d.totalStudents,
        d.placedStudents,
        `${d.placementRate}%`,
        d.averagePackage,
        d.highestPackage,
        `Applications: ${d.totalApplications}`,
      ]);
    });

    // Company Report
    reports.companyReport?.forEach((c) => {
      rows.push([
        'Company Report',
        c.companyName,
        c.applicantCount,
        c.selectedCount,
        `${c.selectionRate}%`,
        c.averagePackage,
        c.highestPackage,
        `Industry: ${c.industry} | Drives: ${c.drivesCount}`,
      ]);
    });

    // Batch Report
    reports.academicYearReport?.forEach((b) => {
      rows.push([
        'Academic Year Report',
        b.academicYear,
        b.totalStudents,
        b.placedStudents,
        `${b.placementRate}%`,
        b.averagePackage,
        b.highestPackage,
        `Total Offers: ${b.totalOffers}`,
      ]);
    });

    // Salary Slabs
    reports.packageDistributionReport?.slabs?.forEach((s) => {
      rows.push([
        'Salary Slab Distribution',
        s.slab,
        s.count,
        s.count,
        `${s.percentage}%`,
        '-',
        '-',
        `Offers in slab: ${s.count}`,
      ]);
    });

    downloadCsv('MITS_Consolidated_Placement_Analytics_Report', headers, rows);
    toast.showSuccess('Consolidated report downloaded successfully.');
  };

  // -------------------------------------------------------------
  // Filtered Tab Datasets
  // -------------------------------------------------------------
  const filteredDepartmentReport = useMemo(() => {
    if (!reports?.departmentReport) return [];
    if (!tableSearch) return reports.departmentReport;
    return reports.departmentReport.filter((d) =>
      d.department.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [reports, tableSearch]);

  const filteredCompanyReport = useMemo(() => {
    if (!reports?.companyReport) return [];
    if (!tableSearch) return reports.companyReport;
    return reports.companyReport.filter(
      (c) =>
        c.companyName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        c.industry.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [reports, tableSearch]);

  const filteredDriveReport = useMemo(() => {
    if (!reports?.driveReport) return [];
    if (!tableSearch) return reports.driveReport;
    return reports.driveReport.filter(
      (d) =>
        d.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
        d.companyName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        d.jobRole.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [reports, tableSearch]);

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* 1. Header with Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <PageHeader
          title="Placement Reports & Analytics"
          subtitle="Real-time institutional placement analytics, department benchmarks, selection funnels and official exportable records."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            className="border-[#DBEAFE] text-[#163A5F] hover:bg-[#EFF6FF]"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={printReportDocument}
            leftIcon={<Printer className="w-4 h-4 text-[#163A5F]" />}
            className="border-[#DBEAFE] text-[#163A5F] hover:bg-[#EFF6FF]"
          >
            Print / PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportApplicants}
            disabled={exportLoading}
            leftIcon={<Download className="w-4 h-4 text-[#2563EB]" />}
            className="border-[#DBEAFE] text-[#2563EB] hover:bg-[#EFF6FF]"
          >
            Export Applicants
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSelected}
            disabled={exportLoading}
            leftIcon={<Award className="w-4 h-4 text-[#0D9488]" />}
            className="border-[#DBEAFE] text-[#0D9488] hover:bg-[#EFF6FF]"
          >
            Export Placed
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportConsolidatedReport}
            leftIcon={<Download className="w-4 h-4 text-white" />}
            className="bg-[#163A5F] hover:bg-[#1E4976] text-white shadow-sm"
          >
            Excel Report (.csv)
          </Button>
        </div>
      </div>

      {/* Official Printable Header (Visible Only When Printing) */}
      <div className="hidden print:block border-b-2 border-[#163A5F] pb-4 mb-4 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide text-[#163A5F]">
          Madanapalle Institute of Technology & Science
        </h1>
        <p className="text-sm font-semibold text-gray-700">
          Training & Placement Cell — Placement & Recruitment Analytics Report
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Generated on: {new Date().toLocaleString()} | Filter Academic Year:{' '}
          {filters.academicYear} | Department: {filters.department}
        </p>
      </div>

      {/* 2. Interactive Filter Bar */}
      <Card className="border-[#DBEAFE] shadow-sm bg-white print:hidden">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#EFF6FF] pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#163A5F]">
              <Filter className="w-4 h-4 text-[#2563EB]" />
              Filter Analytics & Datasets
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#163A5F] font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Academic Year Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Academic Year / Batch
              </label>
              <select
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DBEAFE] bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y === 'All' ? 'All Batches' : `Class of ${y}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DBEAFE] bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company
              </label>
              <select
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DBEAFE] bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="All">All Companies</option>
                {companyOptions.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Placement Drive Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Placement Drive
              </label>
              <select
                value={filters.drive}
                onChange={(e) => handleFilterChange('drive', e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DBEAFE] bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="All">All Drives</option>
                {driveOptions.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.title || d.jobRole} ({d.company?.name || 'Company'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selection Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Selection Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DBEAFE] bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. 8 KPI Summary Cards */}
      {loading && !stats ? (
        <div className="py-12">
          <LoadingSpinner text="Computing real-time MongoDB placement statistics..." />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Registered Students */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-[#2563EB]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Registered Students</p>
                <p className="text-2xl font-bold text-[#163A5F] mt-1">
                  {stats?.totalRegisteredStudents ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Enrolled candidates</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 2: Eligible Students */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-[#2563EB]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Eligible Students</p>
                <p className="text-2xl font-bold text-[#163A5F] mt-1">
                  {stats?.totalEligibleStudents ?? 0}
                </p>
                <p className="text-[11px] text-[#0D9488] font-medium mt-0.5">
                  CGPA ≥ 6.0 & 0 backlogs
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F]">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 3: Partner Companies */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-[#2563EB]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Partner Companies</p>
                <p className="text-2xl font-bold text-[#163A5F] mt-1">
                  {stats?.totalCompanies ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Campus recruiters</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 4: Placement Drives */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-[#2563EB]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Placement Drives</p>
                <p className="text-2xl font-bold text-[#163A5F] mt-1">
                  {stats?.totalPlacementDrives ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Recruitment campaigns</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F]">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 5: Total Applications */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-[#2563EB]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-[#163A5F] mt-1">
                  {stats?.totalApplications ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Student submissions</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 6: Selected Students (Unique Placed) */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-[#0D9488]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Selected Students</p>
                <p className="text-2xl font-bold text-[#0D9488] mt-1">
                  {stats?.totalSelectedStudents ?? 0}
                </p>
                <p className="text-[11px] text-[#0D9488] font-medium mt-0.5">
                  Unique placed candidates
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 border border-[#0D9488]/30 flex items-center justify-center text-[#0D9488]">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 7: Total Rejected Students */}
          <Card className="border-[#DBEAFE] bg-white p-4 shadow-sm hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Rejected Students</p>
                <p className="text-2xl font-bold text-gray-700 mt-1">
                  {stats?.totalRejectedStudents ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Awaiting placement</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 8: Overall Placement Percentage */}
          <Card className="border-[#2563EB]/30 bg-gradient-to-br from-[#EFF6FF] to-white p-4 shadow-sm hover:border-[#2563EB] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Overall Placement %</p>
                <p className="text-2xl font-extrabold text-[#2563EB] mt-1">
                  {stats?.overallPlacementPercentage ?? 0}%
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Eligible:{' '}
                  <span className="font-semibold text-[#0D9488]">
                    {stats?.eligiblePlacementPercentage ?? 0}%
                  </span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Report Navigation Tabs */}
      <div className="border-b border-[#DBEAFE] flex items-center gap-1 overflow-x-auto pb-1 print:hidden">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setTableSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white border-t-2 border-l border-r border-[#2563EB] text-[#2563EB] font-semibold -mb-[1px]'
                  : 'text-gray-600 hover:text-[#163A5F] hover:bg-[#EFF6FF]/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Active Tab Contents */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="Compiling detailed breakdown reports..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB: OVERVIEW & SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Department Highlights & Salary Slabs Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Placement Performance Chart */}
                <Card className="border-[#DBEAFE] shadow-sm bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#163A5F]">
                        Department Placement Rates
                      </h3>
                      <p className="text-xs text-gray-500">
                        Percentage of students placed across departments
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setActiveTab('department')}
                      className="text-xs text-[#2563EB]"
                    >
                      View Table <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {reports?.departmentReport && reports.departmentReport.length > 0 ? (
                      reports.departmentReport.map((dept) => (
                        <div key={dept.department} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {dept.department}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">
                                {dept.placedStudents} / {dept.totalStudents} placed
                              </span>
                              <span className="font-bold text-[#163A5F]">
                                {dept.placementRate}%
                              </span>
                            </div>
                          </div>
                          {/* Visual progress bar */}
                          <div className="w-full bg-[#EFF6FF] rounded-full h-2 overflow-hidden border border-[#DBEAFE]/50">
                            <div
                              className="bg-[#2563EB] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(dept.placementRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No department records found" />
                    )}
                  </div>
                </Card>

                {/* Salary Slab Distribution Bar Chart */}
                <Card className="border-[#DBEAFE] shadow-sm bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#163A5F]">
                        Salary & Package Distribution
                      </h3>
                      <p className="text-xs text-gray-500">
                        Placed students segmented by salary packages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setActiveTab('salary')}
                      className="text-xs text-[#2563EB]"
                    >
                      Full Metrics <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>

                  {/* High Level Salary Stats */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#EFF6FF] rounded-xl border border-[#DBEAFE] mb-4">
                    <div className="text-center">
                      <p className="text-[11px] text-gray-500">Highest Package</p>
                      <p className="text-base font-bold text-[#0D9488]">
                        ₹{reports?.packageDistributionReport?.metrics?.highestPackage ?? 0} LPA
                      </p>
                    </div>
                    <div className="text-center border-x border-[#DBEAFE]">
                      <p className="text-[11px] text-gray-500">Average Package</p>
                      <p className="text-base font-bold text-[#2563EB]">
                        ₹{reports?.packageDistributionReport?.metrics?.averagePackage ?? 0} LPA
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-gray-500">Median Package</p>
                      <p className="text-base font-bold text-[#163A5F]">
                        ₹{reports?.packageDistributionReport?.metrics?.medianPackage ?? 0} LPA
                      </p>
                    </div>
                  </div>

                  {/* Slabs Bar List */}
                  <div className="space-y-3">
                    {reports?.packageDistributionReport?.slabs?.map((slab) => (
                      <div key={slab.slab} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{slab.slab}</span>
                          <span className="text-gray-500">
                            {slab.count} offer{slab.count === 1 ? '' : 's'} ({slab.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#EFF6FF] rounded-full h-2 overflow-hidden border border-[#DBEAFE]/50">
                          <div
                            className="bg-[#0D9488] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(slab.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Application Status Funnel Summary */}
              <Card className="border-[#DBEAFE] shadow-sm bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#163A5F]">
                      Application Pipeline Breakdown
                    </h3>
                    <p className="text-xs text-gray-500">
                      Distribution of all {stats?.totalApplications || 0} candidate applications
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setActiveTab('status')}
                    className="text-xs text-[#2563EB]"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {reports?.statusReport?.map((item) => (
                    <div
                      key={item.status}
                      className="p-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF]/40 text-center"
                    >
                      <p className="text-[11px] font-medium text-gray-600">{item.status}</p>
                      <p className="text-lg font-bold text-[#163A5F] mt-1">{item.count}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        {item.percentage}%
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Recruiting Companies Overview */}
              <Card className="border-[#DBEAFE] shadow-sm bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#163A5F]">
                      Top Recruiting Partners
                    </h3>
                    <p className="text-xs text-gray-500">
                      Companies actively conducting drives and hiring students
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setActiveTab('company')}
                    className="text-xs text-[#2563EB]"
                  >
                    View All Companies <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                {reports?.companyReport && reports.companyReport.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2.5 rounded-l-lg">Company Name</th>
                          <th className="px-3 py-2.5">Industry</th>
                          <th className="px-3 py-2.5">Drives</th>
                          <th className="px-3 py-2.5">Applicants</th>
                          <th className="px-3 py-2.5">Selected</th>
                          <th className="px-3 py-2.5">Selection Rate</th>
                          <th className="px-3 py-2.5 rounded-r-lg">Highest Package</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFF6FF]">
                        {reports.companyReport.slice(0, 5).map((comp) => (
                          <tr key={comp.companyId} className="hover:bg-[#EFF6FF]/30">
                            <td className="px-3 py-2.5 font-semibold text-[#163A5F]">
                              {comp.companyName}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600">{comp.industry}</td>
                            <td className="px-3 py-2.5 text-gray-700">{comp.drivesCount}</td>
                            <td className="px-3 py-2.5 text-gray-700">{comp.applicantCount}</td>
                            <td className="px-3 py-2.5 font-bold text-[#0D9488]">
                              {comp.selectedCount}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-gray-700">
                                {comp.selectionRate}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-[#2563EB]">
                              {comp.highestPackage > 0 ? `₹${comp.highestPackage} LPA` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No company selection records yet" />
                )}
              </Card>
            </div>
          )}

          {/* TAB 1: DEPARTMENT-WISE PLACEMENT REPORT */}
          {activeTab === 'department' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Department-Wise Placement Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Comprehensive placement breakdown by academic branch and discipline
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search department..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs rounded-lg border border-[#DBEAFE] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      const headers = [
                        'Department',
                        'Total Students',
                        'Placed Students',
                        'Total Applications',
                        'Placement Rate (%)',
                        'Average Package (LPA)',
                        'Highest Package (LPA)',
                      ];
                      const rows = filteredDepartmentReport.map((d) => [
                        d.department,
                        d.totalStudents,
                        d.placedStudents,
                        d.totalApplications,
                        d.placementRate,
                        d.averagePackage,
                        d.highestPackage,
                      ]);
                      downloadCsv('MITS_Department_Wise_Placement_Report', headers, rows);
                    }}
                    className="border-[#DBEAFE] text-[#163A5F]"
                    leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                  >
                    Export Table
                  </Button>
                </div>
              </div>

              {filteredDepartmentReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                      <tr>
                        <th className="px-3.5 py-3 rounded-l-lg">Department</th>
                        <th className="px-3.5 py-3">Enrolled Students</th>
                        <th className="px-3.5 py-3">Placed Candidates</th>
                        <th className="px-3.5 py-3">Applications</th>
                        <th className="px-3.5 py-3">Placement Rate</th>
                        <th className="px-3.5 py-3">Average Package</th>
                        <th className="px-3.5 py-3 rounded-r-lg">Highest Package</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFF6FF]">
                      {filteredDepartmentReport.map((d) => (
                        <tr key={d.department} className="hover:bg-[#EFF6FF]/30 transition-colors">
                          <td className="px-3.5 py-3 font-semibold text-[#163A5F]">
                            {d.department}
                          </td>
                          <td className="px-3.5 py-3 text-gray-700">{d.totalStudents}</td>
                          <td className="px-3.5 py-3 font-bold text-[#0D9488]">
                            {d.placedStudents}
                          </td>
                          <td className="px-3.5 py-3 text-gray-600">{d.totalApplications}</td>
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#EFF6FF] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#2563EB] h-1.5 rounded-full"
                                  style={{ width: `${Math.min(d.placementRate, 100)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-gray-800">
                                {d.placementRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-gray-700 font-medium">
                            {d.averagePackage > 0 ? `₹${d.averagePackage} LPA` : 'N/A'}
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-[#2563EB]">
                            {d.highestPackage > 0 ? `₹${d.highestPackage} LPA` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No department records match your search" />
              )}
            </Card>
          )}

          {/* TAB 2: COMPANY-WISE SELECTION REPORT */}
          {activeTab === 'company' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Company-Wise Selection Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Employer hiring analytics, conversion ratios and compensation offerings
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search company..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs rounded-lg border border-[#DBEAFE] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      const headers = [
                        'Company Name',
                        'Industry',
                        'Location',
                        'Drives Count',
                        'Applicant Count',
                        'Selected Count',
                        'Selection Rate (%)',
                        'Average Package (LPA)',
                        'Highest Package (LPA)',
                      ];
                      const rows = filteredCompanyReport.map((c) => [
                        c.companyName,
                        c.industry,
                        c.location,
                        c.drivesCount,
                        c.applicantCount,
                        c.selectedCount,
                        c.selectionRate,
                        c.averagePackage,
                        c.highestPackage,
                      ]);
                      downloadCsv('MITS_Company_Wise_Selection_Report', headers, rows);
                    }}
                    className="border-[#DBEAFE] text-[#163A5F]"
                    leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                  >
                    Export Table
                  </Button>
                </div>
              </div>

              {filteredCompanyReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                      <tr>
                        <th className="px-3.5 py-3 rounded-l-lg">Company Name</th>
                        <th className="px-3.5 py-3">Industry</th>
                        <th className="px-3.5 py-3">Location</th>
                        <th className="px-3.5 py-3">Drives Held</th>
                        <th className="px-3.5 py-3">Applicants</th>
                        <th className="px-3.5 py-3">Selected</th>
                        <th className="px-3.5 py-3">Selection Rate</th>
                        <th className="px-3.5 py-3">Average Package</th>
                        <th className="px-3.5 py-3 rounded-r-lg">Highest Package</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFF6FF]">
                      {filteredCompanyReport.map((c) => (
                        <tr key={c.companyId} className="hover:bg-[#EFF6FF]/30 transition-colors">
                          <td className="px-3.5 py-3 font-semibold text-[#163A5F]">
                            {c.companyName}
                          </td>
                          <td className="px-3.5 py-3 text-gray-600">{c.industry}</td>
                          <td className="px-3.5 py-3 text-gray-500">{c.location}</td>
                          <td className="px-3.5 py-3 text-gray-700">{c.drivesCount}</td>
                          <td className="px-3.5 py-3 text-gray-700">{c.applicantCount}</td>
                          <td className="px-3.5 py-3 font-bold text-[#0D9488]">
                            {c.selectedCount}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-gray-700">
                            {c.selectionRate}%
                          </td>
                          <td className="px-3.5 py-3 text-gray-700 font-medium">
                            {c.averagePackage > 0 ? `₹${c.averagePackage} LPA` : 'N/A'}
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-[#2563EB]">
                            {c.highestPackage > 0 ? `₹${c.highestPackage} LPA` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No company records match your search" />
              )}
            </Card>
          )}

          {/* TAB 3: ACADEMIC YEAR / BATCH REPORT */}
          {activeTab === 'batch' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Academic Year-Wise (Batch) Placement Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Graduating batch trends, placement progression and package evolution
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const headers = [
                      'Academic Year',
                      'Batch',
                      'Enrolled Students',
                      'Placed Students',
                      'Placement Rate (%)',
                      'Total Offers',
                      'Average Package (LPA)',
                      'Highest Package (LPA)',
                    ];
                    const rows = (reports?.academicYearReport || []).map((b) => [
                      b.academicYear,
                      b.batch,
                      b.totalStudents,
                      b.placedStudents,
                      b.placementRate,
                      b.totalOffers,
                      b.averagePackage,
                      b.highestPackage,
                    ]);
                    downloadCsv('MITS_Academic_Year_Wise_Placement_Report', headers, rows);
                  }}
                  className="border-[#DBEAFE] text-[#163A5F]"
                  leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                >
                  Export Table
                </Button>
              </div>

              {reports?.academicYearReport && reports.academicYearReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                      <tr>
                        <th className="px-3.5 py-3 rounded-l-lg">Graduating Batch</th>
                        <th className="px-3.5 py-3">Enrolled Students</th>
                        <th className="px-3.5 py-3">Placed Students</th>
                        <th className="px-3.5 py-3">Placement Rate</th>
                        <th className="px-3.5 py-3">Total Job Offers</th>
                        <th className="px-3.5 py-3">Average Package</th>
                        <th className="px-3.5 py-3 rounded-r-lg">Highest Package</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFF6FF]">
                      {reports.academicYearReport.map((b) => (
                        <tr key={b.batch} className="hover:bg-[#EFF6FF]/30 transition-colors">
                          <td className="px-3.5 py-3 font-semibold text-[#163A5F]">
                            {b.academicYear}
                          </td>
                          <td className="px-3.5 py-3 text-gray-700">{b.totalStudents}</td>
                          <td className="px-3.5 py-3 font-bold text-[#0D9488]">
                            {b.placedStudents}
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="font-semibold text-gray-800">
                              {b.placementRate}%
                            </span>
                          </td>
                          <td className="px-3.5 py-3 font-medium text-gray-700">{b.totalOffers}</td>
                          <td className="px-3.5 py-3 text-gray-700 font-medium">
                            {b.averagePackage > 0 ? `₹${b.averagePackage} LPA` : 'N/A'}
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-[#2563EB]">
                            {b.highestPackage > 0 ? `₹${b.highestPackage} LPA` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No batch records found" />
              )}
            </Card>
          )}

          {/* TAB 4: PLACEMENT DRIVE-WISE APPLICANT REPORT */}
          {activeTab === 'drives' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Placement Drive-Wise Applicant Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Drive-specific applicant volumes, stage transitions and final conversion ratios
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search drives..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs rounded-lg border border-[#DBEAFE] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      const headers = [
                        'Drive Title',
                        'Company',
                        'Job Role',
                        'Package (LPA)',
                        'Drive Status',
                        'Total Applicants',
                        'Under Review',
                        'Shortlisted',
                        'Interviewing',
                        'Selected',
                        'Rejected',
                        'Conversion Rate (%)',
                      ];
                      const rows = filteredDriveReport.map((d) => [
                        d.title,
                        d.companyName,
                        d.jobRole,
                        d.packageLPA,
                        d.status,
                        d.totalApplicants,
                        d.underReviewCount,
                        d.shortlistedCount,
                        d.interviewingCount,
                        d.selectedCount,
                        d.rejectedCount,
                        d.conversionRate,
                      ]);
                      downloadCsv('MITS_Drive_Wise_Applicant_Report', headers, rows);
                    }}
                    className="border-[#DBEAFE] text-[#163A5F]"
                    leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                  >
                    Export Table
                  </Button>
                </div>
              </div>

              {filteredDriveReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                      <tr>
                        <th className="px-3 py-3 rounded-l-lg">Drive / Role</th>
                        <th className="px-3 py-3">Company</th>
                        <th className="px-3 py-3">Package</th>
                        <th className="px-3 py-3">Applicants</th>
                        <th className="px-3 py-3">Under Review</th>
                        <th className="px-3 py-3">Shortlisted</th>
                        <th className="px-3 py-3">Interviewing</th>
                        <th className="px-3 py-3">Selected</th>
                        <th className="px-3 py-3">Rejected</th>
                        <th className="px-3 py-3 rounded-r-lg">Conversion %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFF6FF]">
                      {filteredDriveReport.map((d) => (
                        <tr key={d.driveId} className="hover:bg-[#EFF6FF]/30 transition-colors">
                          <td className="px-3 py-3">
                            <p className="font-semibold text-[#163A5F]">{d.title || d.jobRole}</p>
                            <span className="text-[10px] text-gray-500">{d.jobRole}</span>
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-700">{d.companyName}</td>
                          <td className="px-3 py-3 font-semibold text-[#2563EB]">
                            ₹{d.packageLPA} LPA
                          </td>
                          <td className="px-3 py-3 font-bold text-[#163A5F]">
                            {d.totalApplicants}
                          </td>
                          <td className="px-3 py-3 text-gray-600">{d.underReviewCount}</td>
                          <td className="px-3 py-3 text-blue-600 font-medium">
                            {d.shortlistedCount}
                          </td>
                          <td className="px-3 py-3 text-amber-600 font-medium">
                            {d.interviewingCount}
                          </td>
                          <td className="px-3 py-3 font-bold text-[#0D9488]">
                            {d.selectedCount}
                          </td>
                          <td className="px-3 py-3 text-rose-500">{d.rejectedCount}</td>
                          <td className="px-3 py-3 font-bold text-gray-800">
                            {d.conversionRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No placement drive records match your search" />
              )}
            </Card>
          )}

          {/* TAB 5: APPLICATION STATUS REPORT */}
          {activeTab === 'status' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Application Status Distribution Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Candidate application volume by progress stage across all drives
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const headers = ['Application Status', 'Applicant Count', 'Share Percentage (%)'];
                    const rows = (reports?.statusReport || []).map((s) => [
                      s.status,
                      s.count,
                      s.percentage,
                    ]);
                    downloadCsv('MITS_Application_Status_Breakdown_Report', headers, rows);
                  }}
                  className="border-[#DBEAFE] text-[#163A5F]"
                  leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                >
                  Export Table
                </Button>
              </div>

              {/* Visual Multi-Segment Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-medium">Status Distribution Pipeline</span>
                  <span className="font-bold text-[#163A5F]">
                    {stats?.totalApplications || 0} Total Applications
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 border border-[#DBEAFE]">
                  {reports?.statusReport?.map((s, idx) => {
                    const colors = [
                      'bg-slate-400',
                      'bg-sky-500',
                      'bg-blue-600',
                      'bg-amber-500',
                      'bg-[#0D9488]',
                      'bg-rose-500',
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={s.status}
                        className={`${color} h-full transition-all`}
                        style={{ width: `${s.percentage}%` }}
                        title={`${s.status}: ${s.count} (${s.percentage}%)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-3 rounded-l-lg">Status Stage</th>
                      <th className="px-3.5 py-3">Number of Candidates</th>
                      <th className="px-3.5 py-3">Percentage Share</th>
                      <th className="px-3.5 py-3 rounded-r-lg">Visual Proportion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFF6FF]">
                    {reports?.statusReport?.map((s) => (
                      <tr key={s.status} className="hover:bg-[#EFF6FF]/30 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-[#163A5F]">
                          {s.status}
                        </td>
                        <td className="px-3.5 py-3 font-bold text-gray-800">{s.count}</td>
                        <td className="px-3.5 py-3 font-semibold text-[#2563EB]">
                          {s.percentage}%
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="w-32 bg-[#EFF6FF] rounded-full h-2 overflow-hidden border border-[#DBEAFE]/40">
                            <div
                              className="bg-[#2563EB] h-2 rounded-full"
                              style={{ width: `${Math.min(s.percentage, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 6: RECRUITMENT ROUND-WISE SELECTION REPORT */}
          {activeTab === 'rounds' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Recruitment Round-Wise Selection Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Candidate evaluation results, screening attrition and pass ratios per round
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const headers = [
                      'Round Number',
                      'Round Name',
                      'Total Candidates Evaluated',
                      'Passed Candidates',
                      'Failed Candidates',
                      'Pending Evaluations',
                      'Pass Rate (%)',
                    ];
                    const rows = (reports?.roundReport || []).map((r) => [
                      r.roundNumber,
                      r.roundName,
                      r.totalCandidates,
                      r.passed,
                      r.failed,
                      r.pending,
                      r.passRate,
                    ]);
                    downloadCsv('MITS_Recruitment_Round_Selection_Report', headers, rows);
                  }}
                  className="border-[#DBEAFE] text-[#163A5F]"
                  leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                >
                  Export Table
                </Button>
              </div>

              {reports?.roundReport && reports.roundReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                      <tr>
                        <th className="px-3.5 py-3 rounded-l-lg">Round Stage</th>
                        <th className="px-3.5 py-3">Total Candidates</th>
                        <th className="px-3.5 py-3">Passed</th>
                        <th className="px-3.5 py-3">Failed / Dropped</th>
                        <th className="px-3.5 py-3">Pending Review</th>
                        <th className="px-3.5 py-3 rounded-r-lg">Pass Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFF6FF]">
                      {reports.roundReport.map((r, i) => (
                        <tr key={i} className="hover:bg-[#EFF6FF]/30 transition-colors">
                          <td className="px-3.5 py-3 font-semibold text-[#163A5F]">
                            Round {r.roundNumber}: {r.roundName}
                          </td>
                          <td className="px-3.5 py-3 font-bold text-gray-800">
                            {r.totalCandidates}
                          </td>
                          <td className="px-3.5 py-3 font-bold text-[#0D9488]">{r.passed}</td>
                          <td className="px-3.5 py-3 text-rose-500 font-medium">{r.failed}</td>
                          <td className="px-3.5 py-3 text-amber-600 font-medium">{r.pending}</td>
                          <td className="px-3.5 py-3 font-bold text-[#2563EB]">
                            {r.passRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No recruitment rounds data recorded"
                  description="Create rounds in Recruitment Rounds module to begin tracking round-level candidate performance."
                />
              )}
            </Card>
          )}

          {/* TAB 7: SALARY / PACKAGE DISTRIBUTION REPORT */}
          {activeTab === 'salary' && (
            <Card className="border-[#DBEAFE] shadow-sm bg-white p-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#163A5F]">
                    Salary & Compensation Distribution Report
                  </h3>
                  <p className="text-xs text-gray-500">
                    Compensation analysis, tier distributions and offer statistics
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const headers = ['Salary Slab', 'Offer Count', 'Percentage Share (%)'];
                    const rows = (reports?.packageDistributionReport?.slabs || []).map((s) => [
                      s.slab,
                      s.count,
                      s.percentage,
                    ]);
                    downloadCsv('MITS_Salary_Distribution_Report', headers, rows);
                  }}
                  className="border-[#DBEAFE] text-[#163A5F]"
                  leftIcon={<Download className="w-3 h-3 text-[#2563EB]" />}
                >
                  Export Table
                </Button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/5">
                  <p className="text-xs font-medium text-[#0D9488]">Highest Package</p>
                  <p className="text-2xl font-black text-[#0D9488] mt-1">
                    ₹{reports?.packageDistributionReport?.metrics?.highestPackage ?? 0} LPA
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Top campus offer</p>
                </div>

                <div className="p-4 rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/5">
                  <p className="text-xs font-medium text-[#2563EB]">Average Package</p>
                  <p className="text-2xl font-black text-[#2563EB] mt-1">
                    ₹{reports?.packageDistributionReport?.metrics?.averagePackage ?? 0} LPA
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Mean compensation</p>
                </div>

                <div className="p-4 rounded-xl border border-[#163A5F]/30 bg-[#163A5F]/5">
                  <p className="text-xs font-medium text-[#163A5F]">Median Package</p>
                  <p className="text-2xl font-black text-[#163A5F] mt-1">
                    ₹{reports?.packageDistributionReport?.metrics?.medianPackage ?? 0} LPA
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">50th percentile offer</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-xs font-medium text-gray-600">Lowest Package</p>
                  <p className="text-2xl font-black text-gray-700 mt-1">
                    ₹{reports?.packageDistributionReport?.metrics?.lowestPackage ?? 0} LPA
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Base offer floor</p>
                </div>
              </div>

              {/* Table of Slabs */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EFF6FF] text-[#163A5F] uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-3 rounded-l-lg">Salary Slab Bracket</th>
                      <th className="px-3.5 py-3">Number of Confirmed Offers</th>
                      <th className="px-3.5 py-3">Percentage of Placements</th>
                      <th className="px-3.5 py-3 rounded-r-lg">Distribution Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFF6FF]">
                    {reports?.packageDistributionReport?.slabs?.map((slab) => (
                      <tr key={slab.slab} className="hover:bg-[#EFF6FF]/30 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-[#163A5F]">{slab.slab}</td>
                        <td className="px-3.5 py-3 font-bold text-gray-800">{slab.count}</td>
                        <td className="px-3.5 py-3 font-bold text-[#0D9488]">
                          {slab.percentage}%
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="w-36 bg-[#EFF6FF] rounded-full h-2.5 overflow-hidden border border-[#DBEAFE]/50">
                            <div
                              className="bg-[#0D9488] h-2.5 rounded-full"
                              style={{ width: `${Math.min(slab.percentage, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageReports;
