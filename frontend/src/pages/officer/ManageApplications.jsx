import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Filter,
  Search,
  Building2,
  Calendar,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Edit3,
  History,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  RotateCcw,
  Users,
  Award,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { driveService } from '../../services/driveService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusUpdateModal from '../../components/officer/StatusUpdateModal';
import StudentProfileModal from '../../components/officer/StudentProfileModal';
import StatusHistoryModal from '../../components/officer/StatusHistoryModal';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatLPA } from '../../utils/formatters';
import { getImageUrl } from '../../utils/imageUrl';

const STATUS_OPTIONS = [
  'All',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interviewing',
  'Selected',
  'Rejected',
];

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const CGPA_FILTERS = [
  { label: 'Any CGPA', value: '' },
  { label: 'Min 6.0+ CGPA', value: '6.0' },
  { label: 'Min 6.5+ CGPA', value: '6.5' },
  { label: 'Min 7.0+ CGPA', value: '7.0' },
  { label: 'Min 7.5+ CGPA', value: '7.5' },
  { label: 'Min 8.0+ CGPA', value: '8.0' },
  { label: 'Min 8.5+ CGPA', value: '8.5' },
];

const SORT_OPTIONS = [
  { label: 'Applied Date (Newest first)', sortBy: 'appliedAt', sortOrder: 'desc' },
  { label: 'Applied Date (Oldest first)', sortBy: 'appliedAt', sortOrder: 'asc' },
  { label: 'CGPA (Highest first)', sortBy: 'cgpa', sortOrder: 'desc' },
  { label: 'CGPA (Lowest first)', sortBy: 'cgpa', sortOrder: 'asc' },
  { label: 'Candidate Name (A-Z)', sortBy: 'name', sortOrder: 'asc' },
  { label: 'Roll Number (Ascending)', sortBy: 'rollNumber', sortOrder: 'asc' },
  { label: 'Application Status', sortBy: 'status', sortOrder: 'asc' },
];

const ManageApplications = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDriveId = searchParams.get('driveId') || '';

  // Data states
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(initialDriveId);
  const [currentDriveInfo, setCurrentDriveInfo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedCgpa, setSelectedCgpa] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortIndex, setSortIndex] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const limit = 10;

  // Modals state
  const [appForStatusUpdate, setAppForStatusUpdate] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [appForHistory, setAppForHistory] = useState(null);
  const [downloadingAppId, setDownloadingAppId] = useState(null);

  // 1. Fetch available placement drives
  const fetchDrives = async () => {
    try {
      const res = await driveService.getAllDrives();
      setDrives(res.drives || []);
    } catch (err) {
      console.error('Failed to load placement drives', err);
    }
  };

  // 2. Fetch applicants based on active drive, search, filters & pagination
  const fetchApplicants = async (page = currentPage) => {
    try {
      setLoading(true);
      const activeSort = SORT_OPTIONS[sortIndex];
      const params = {
        page,
        limit,
        sortBy: activeSort.sortBy,
        sortOrder: activeSort.sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedDepartment && selectedDepartment !== 'All') {
        params.department = selectedDepartment;
      }
      if (selectedCgpa) params.minCgpa = selectedCgpa;
      if (selectedStatus && selectedStatus !== 'All') {
        params.status = selectedStatus;
      }

      let res;
      if (selectedDriveId) {
        res = await applicationService.getDriveApplicants(selectedDriveId, params);
        if (res.drive) {
          setCurrentDriveInfo(res.drive);
        }
      } else {
        res = await applicationService.getAllApplications(params);
        setCurrentDriveInfo(null);
      }

      setApplications(res.applications || []);
      setTotalApplicants(res.total ?? (res.applications ? res.applications.length : 0));
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage || page);
    } catch (err) {
      console.error('Failed to load applicants', err);
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to fetch applicants.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchApplicants(1);
    if (selectedDriveId) {
      setSearchParams({ driveId: selectedDriveId });
    } else {
      setSearchParams({});
    }
  }, [selectedDriveId, selectedStatus, selectedDepartment, selectedCgpa, sortIndex]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplicants(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDepartment('All');
    setSelectedCgpa('');
    setSelectedStatus('All');
    setSortIndex(0);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchApplicants(newPage);
    }
  };

  // Download student resume
  const handleDownloadResume = async (app) => {
    try {
      setDownloadingAppId(app._id);
      const response = await applicationService.downloadApplicantResume(app._id);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const candidateName = (app.student?.name || 'Applicant').replace(/\s+/g, '_');
      link.download =
        app.resumeSnapshot?.resumeOriginalName ||
        app.studentProfile?.resumeOriginalName ||
        `${candidateName}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Resume for ${app.student?.name || 'candidate'} downloaded.`);
      setActionAlert({
        type: 'success',
        text: `Resume for ${app.student?.name || 'candidate'} downloaded successfully.`,
      });
    } catch (err) {
      console.error('Resume download error', err);
      const fallbackUrl = app.resumeSnapshot?.resumeUrl || app.studentProfile?.resumeUrl;
      if (fallbackUrl) {
        window.open(fallbackUrl, '_blank');
        toast.info('Opened resume link in a new tab.');
      } else {
        toast.error('Resume document could not be retrieved.');
        setActionAlert({
          type: 'error',
          text: 'Resume document could not be retrieved.',
        });
      }
    } finally {
      setDownloadingAppId(null);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    selectedDepartment !== 'All' ||
    Boolean(selectedCgpa) ||
    selectedStatus !== 'All' ||
    sortIndex !== 0;

  // Selected Drive details fallback
  const driveInfo = currentDriveInfo || drives.find((d) => d._id === selectedDriveId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        category="Applicant Management"
        title="Placement Drive Applicants"
        subtitle="Review candidate qualifications, inspect academic profiles, download resumes, and manage hiring outcomes"
        badge={`${totalApplicants} ${totalApplicants === 1 ? 'Applicant' : 'Total Applicants'}`}
        actions={
          selectedDriveId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDriveId('')}
            >
              Clear Drive Filter
            </Button>
          )
        }
      />

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Drive Selection Box */}
      <div className="bg-white p-4 rounded-xl border border-[#DBEAFE] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Briefcase className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            <label className="text-xs font-bold text-[#172554] whitespace-nowrap">
              Select Placement Drive:
            </label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="flex-1 max-w-xl h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white font-medium text-[#172554]"
            >
              <option value="">All Placement Drives ({drives.length})</option>
              {drives.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title} • {d.company?.name || 'Company'} ({d.jobRole})
                </option>
              ))}
            </select>
          </div>

          {selectedDriveId && (
            <button
              type="button"
              onClick={() => setSelectedDriveId('')}
              className="text-xs text-[#2563EB] hover:underline font-semibold whitespace-nowrap"
            >
              Show All Drives
            </button>
          )}
        </div>

        {/* Selected Drive Summary Card */}
        {driveInfo && (
          <div className="mt-3 pt-3 border-t border-[#DBEAFE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F0F7FF] p-3.5 rounded-lg border border-[#DBEAFE]">
            <div className="flex items-center gap-3">
              {driveInfo.company?.logoUrl ? (
                <img
                  src={driveInfo.company.logoUrl}
                  alt={driveInfo.company?.name}
                  className="w-10 h-10 rounded-lg object-contain p-0.5 border border-[#DBEAFE] bg-white flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-base flex-shrink-0">
                  {driveInfo.company?.name ? driveInfo.company.name.charAt(0) : 'C'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#172554] text-sm">{driveInfo.title}</span>
                  <Badge status={driveInfo.status} size="sm" />
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  <strong className="text-[#172554]">{driveInfo.company?.name}</strong> • Role: {driveInfo.jobRole} • Package: <span className="font-bold text-[#163A5F]">{formatLPA(driveInfo.packageLPA)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs flex-shrink-0">
              <div className="text-right">
                <span className="text-[11px] text-[#64748B] block">Cutoff Requirement</span>
                <span className="font-semibold text-[#172554] block">
                  {driveInfo.eligibilityCriteria?.minCgpa ? `${driveInfo.eligibilityCriteria.minCgpa}+ CGPA` : 'No CGPA cutoff'}
                </span>
              </div>
              <Link to={`/drives/${driveInfo._id}`} className="flex-shrink-0">
                <Button variant="outline" size="sm">
                  Drive Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DBEAFE] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="sm:col-span-4">
            <Input
              placeholder="Search by candidate name or roll number..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments / Branches' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Min CGPA Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedCgpa}
              onChange={(e) => setSelectedCgpa(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              {CGPA_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>

            <Button type="submit" size="sm">
              Filter
            </Button>
          </div>
        </form>

        {/* Secondary Toolbar: Sorting & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DBEAFE] text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="text-[#64748B] text-[11px] font-medium">Sort By:</span>
            <select
              value={sortIndex}
              onChange={(e) => setSortIndex(Number(e.target.value))}
              className="h-[30px] rounded-md border border-[#DBEAFE] text-xs px-2.5 focus:outline-none focus:border-[#2563EB] bg-white font-medium text-[#172554]"
            >
              {SORT_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#DC2626] transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Applicants Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving applicant pool records..." />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants found"
          description={
            hasActiveFilters
              ? 'No candidates match your current search and filter criteria. Try resetting filters.'
              : selectedDriveId
              ? 'No students have applied for this placement drive yet.'
              : 'No applicants have submitted applications across your placement drives.'
          }
          actionLabel={hasActiveFilters ? 'Clear Active Filters' : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0F7FF] border-b border-[#DBEAFE] text-[11px] font-semibold text-[#172554] uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[190px]">Student Name</th>
                  <th className="py-3 px-3 min-w-[110px]">Roll Number</th>
                  <th className="py-3 px-3 min-w-[150px]">Department</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">CGPA</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">10th %</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Inter %</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Backlogs</th>
                  <th className="py-3 px-3 min-w-[110px]">Applied Date</th>
                  <th className="py-3 px-3 min-w-[120px]">Current Status</th>
                  <th className="py-3 px-4 text-right min-w-[170px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]/60 text-xs">
                {applications.map((app) => {
                  const student = app.student || {};
                  const profile = app.studentProfile || {};
                  const snapshot = app.resumeSnapshot || {};

                  const rollNo = profile.rollNumber || snapshot.studentRollNumber || 'N/A';
                  const dept = profile.department || snapshot.studentDepartment || 'N/A';
                  const cgpa =
                    profile.cgpa !== undefined
                      ? profile.cgpa
                      : snapshot.studentCgpa !== undefined
                      ? snapshot.studentCgpa
                      : null;
                  const tenth = profile.tenthPercentage ?? '—';
                  const twelfth = profile.twelfthPercentage ?? '—';
                  const activeBacklogs = profile.activeBacklogs ?? profile.backlogs ?? 0;
                  const totalBacklogs = profile.totalBacklogs ?? activeBacklogs;

                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-[#F0F7FF] transition-colors"
                    >
                      {/* 1. Student Name */}
                      <td className="py-3 px-4 min-w-[190px]">
                        <div className="flex items-center gap-2.5">
                          {student.profilePhoto ? (
                            <img
                              src={getImageUrl(student.profilePhoto)}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#DBEAFE] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-xs flex-shrink-0">
                              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-[#172554] block truncate leading-tight">
                              {student.name || 'Candidate'}
                            </span>
                            <span className="text-[11px] text-[#64748B] block truncate mt-0.5">
                              {student.email || 'No email'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Roll Number */}
                      <td className="py-3 px-3 font-mono font-medium text-[#172554] whitespace-nowrap min-w-[110px]">
                        <span className="bg-[#EFF6FF] px-2 py-0.5 rounded text-[11px] border border-[#DBEAFE] font-semibold text-[#163A5F]">
                          {rollNo}
                        </span>
                      </td>

                      {/* 3. Department */}
                      <td className="py-3 px-3 font-medium text-[#172554] min-w-[150px]">
                        <span className="block truncate max-w-[140px]" title={dept}>
                          {dept}
                        </span>
                      </td>

                      {/* 4. CGPA */}
                      <td className="py-3 px-3 text-center whitespace-nowrap min-w-[80px]">
                        <span className="font-bold text-[#172554]">
                          {cgpa !== null ? Number(cgpa).toFixed(2) : 'N/A'}
                        </span>
                      </td>

                      {/* 5. 10th percentage */}
                      <td className="py-3 px-3 text-center font-medium text-[#172554] whitespace-nowrap min-w-[80px]">
                        {tenth !== '—' ? `${tenth}%` : '—'}
                      </td>

                      {/* 6. Intermediate percentage */}
                      <td className="py-3 px-3 text-center font-medium text-[#172554] whitespace-nowrap min-w-[90px]">
                        {twelfth !== '—' ? `${twelfth}%` : '—'}
                      </td>

                      {/* 7. Backlogs */}
                      <td className="py-3 px-3 text-center whitespace-nowrap min-w-[100px]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-medium text-[11px] ${
                            activeBacklogs > 0
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30'
                              : 'bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30'
                          }`}
                        >
                          {activeBacklogs} Act / {totalBacklogs} Tot
                        </span>
                      </td>

                      {/* 8. Application date */}
                      <td className="py-3 px-3 text-[#64748B] whitespace-nowrap min-w-[110px]">
                        {formatDate(app.appliedAt)}
                      </td>

                      {/* 9. Current status */}
                      <td className="py-3 px-3 whitespace-nowrap min-w-[120px]">
                        <Badge status={app.status} size="sm" />
                        {app.currentRound > 1 && (
                          <span className="text-[11px] text-[#64748B] block mt-0.5">
                            Round {app.currentRound}
                          </span>
                        )}
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap min-w-[170px]">
                        <div className="flex items-center justify-end gap-1">
                          {/* Update Status Button */}
                          <button
                            type="button"
                            onClick={() => setAppForStatusUpdate(app)}
                            className="p-1.5 rounded-lg text-[#2563EB] hover:text-[#163A5F] hover:bg-[#EFF6FF] transition-colors"
                            title="Update Selection Status & Remarks"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* View Complete Profile Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setProfileTarget({
                                studentId: profile._id || student._id,
                                applicationId: app._id,
                              })
                            }
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#EFF6FF] transition-colors"
                            title="View Complete Academic Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download Resume Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadResume(app)}
                            disabled={downloadingAppId === app._id}
                            className="p-1.5 rounded-lg text-[#0D9488] hover:text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors disabled:opacity-50"
                            title="Download Candidate Resume"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Status History Button */}
                          <button
                            type="button"
                            onClick={() => setAppForHistory(app)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#EFF6FF] transition-colors"
                            title="View Status History Audit Trail"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={totalApplicants}
            pageSize={limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 1. Status Update Modal (with confirmation for Selected & Rejected) */}
      <StatusUpdateModal
        isOpen={Boolean(appForStatusUpdate)}
        onClose={() => setAppForStatusUpdate(null)}
        application={appForStatusUpdate}
        onSuccess={(res) => {
          toast.success(res.message || 'Applicant status updated successfully.');
          setActionAlert({
            type: 'success',
            text: res.message || 'Applicant status updated successfully.',
          });
          fetchApplicants(currentPage);
        }}
      />

      {/* 2. Complete Student Profile Modal */}
      <StudentProfileModal
        isOpen={Boolean(profileTarget)}
        onClose={() => setProfileTarget(null)}
        studentId={profileTarget?.studentId}
        applicationId={profileTarget?.applicationId}
      />

      {/* 3. Status History Modal */}
      <StatusHistoryModal
        isOpen={Boolean(appForHistory)}
        onClose={() => setAppForHistory(null)}
        application={appForHistory}
      />
    </div>
  );
};

export default ManageApplications;
