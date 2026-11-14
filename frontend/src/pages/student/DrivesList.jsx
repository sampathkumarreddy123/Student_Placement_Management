import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Briefcase,
  SlidersHorizontal,
  CheckCircle2,
  Building2,
  GraduationCap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { driveService } from '../../services/driveService';
import { companyService } from '../../services/companyService';
import DriveCard from '../../components/drives/DriveCard';
import ApplyConfirmModal from '../../components/drives/ApplyConfirmModal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { DriveCardSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
];

const DrivesList = () => {
  const toast = useToast();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [jobRoleFilter, setJobRoleFilter] = useState('');
  const [minPackage, setMinPackage] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);

  // Apply flow
  const [actionAlert, setActionAlert] = useState(null);
  const [selectedDriveForApply, setSelectedDriveForApply] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await companyService.getCompanies({ limit: 100 });
      setCompanies(res.companies || []);
    } catch (err) {
      console.error('Failed to load companies list', err);
    }
  };

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCompany) params.company = selectedCompany;
      if (selectedDepartment) params.department = selectedDepartment;
      if (jobRoleFilter.trim()) params.jobRole = jobRoleFilter.trim();
      if (minPackage) params.minPackage = minPackage;
      if (onlyEligible) params.eligibleOnly = true;

      const res = await driveService.getAllDrives(params);
      setDrives(res.drives || []);
    } catch (err) {
      console.error('Failed to load drives', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [selectedCompany, selectedDepartment, minPackage, onlyEligible]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrives();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCompany('');
    setSelectedDepartment('');
    setJobRoleFilter('');
    setMinPackage('');
    setOnlyEligible(false);
  };

  const handleOpenApplyModal = (driveId) => {
    const drive = drives.find((d) => d._id === driveId);
    if (drive) {
      setSelectedDriveForApply(drive);
      setIsApplyModalOpen(true);
    }
  };

  const handleApplySuccess = (res) => {
    toast.success(res.message || 'Your placement application has been successfully submitted!');
    fetchDrives();
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCompany) ||
    Boolean(selectedDepartment) ||
    Boolean(jobRoleFilter) ||
    Boolean(minPackage) ||
    onlyEligible;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Consistent Page Header */}
      <PageHeader
        title="Campus Placement Drives"
        subtitle="Explore verified corporate recruitment schedules and submit your job applications"
        category="Student Placement Operations"
        badge={`${drives.length} Drives Available`}
        actions={
          <button
            type="button"
            onClick={() => setOnlyEligible(!onlyEligible)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              onlyEligible
                ? 'bg-[#44352D] text-[#F1E7D9] border-[#44352D] shadow-sm'
                : 'bg-white text-[#44352D] border-[#E8DED2] hover:bg-[#FAF8F4]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${onlyEligible ? 'text-[#F1E7D9]' : 'text-[#27845B]'}`} />
            <span>Eligible Only ({drives.filter((d) => d.isEligible).length})</span>
          </button>
        }
      />

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DED2] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-5">
            <Input
              placeholder="Search by company, role, title, or skills..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Company Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-[#E8DED2] text-xs px-3 focus:outline-none focus:border-[#76543D] bg-white text-[#44352D]"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-[#E8DED2] text-xs px-3 focus:outline-none focus:border-[#76543D] bg-white text-[#44352D]"
            >
              <option value="">All Branches</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Min Package Selector */}
          <div className="sm:col-span-2 flex gap-2">
            <select
              value={minPackage}
              onChange={(e) => setMinPackage(e.target.value)}
              className="flex-1 h-[38px] rounded-lg border border-[#E8DED2] text-xs px-2.5 focus:outline-none focus:border-[#76543D] bg-white text-[#44352D]"
            >
              <option value="">Any CTC</option>
              <option value="6">Min 6 LPA</option>
              <option value="10">Min 10 LPA</option>
              <option value="15">Min 15 LPA</option>
              <option value="20">Min 20+ LPA</option>
            </select>

            <Button type="submit" size="sm">
              Search
            </Button>
          </div>
        </form>

        {/* Secondary Row: Job role input & Clear filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8DED2] text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <span className="text-[#82776C] text-[11px] font-medium whitespace-nowrap">Job Role:</span>
            <input
              type="text"
              placeholder="Filter by role (e.g. SDE, Analyst)..."
              value={jobRoleFilter}
              onChange={(e) => setJobRoleFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDrives()}
              className="h-[30px] rounded-md border border-[#E8DED2] text-xs px-2.5 flex-1 focus:outline-none focus:border-[#76543D] bg-white text-[#44352D]"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#82776C] hover:text-[#C94C4C] transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <DriveCardSkeleton key={idx} />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matching placement drives found"
          description={
            hasActiveFilters
              ? 'No campus recruitment drives match your current filter parameters. Try clearing or expanding your search filters.'
              : 'There are currently no published placement drives available. Check back soon as new drives are announced by recruiters.'
          }
          actionText={hasActiveFilters ? 'Clear All Filters' : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drives.map((drive) => (
            <DriveCard
              key={drive._id}
              drive={drive}
              onApply={handleOpenApplyModal}
              applying={false}
            />
          ))}
        </div>
      )}

      {/* Application Confirmation Modal */}
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

export default DrivesList;
