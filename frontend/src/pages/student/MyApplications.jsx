import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertCircle,
  Search,
  RotateCcw,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ApplicationDetailsModal from '../../components/applications/ApplicationDetailsModal';
import { formatDate, formatLPA } from '../../utils/formatters';

const STATUS_FILTERS = [
  { id: 'All', label: 'All Applications' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Under Review', label: 'Under Review' },
  { id: 'Shortlisted', label: 'Shortlisted' },
  { id: 'Selected', label: 'Selected' },
  { id: 'Rejected', label: 'Rejected' },
];

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationService.getMyApplications();
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setIsDetailsOpen(true);
  };

  // Filter & Search
  const filteredApplications = useMemo(() => {
    let result = applications;
    if (activeFilter !== 'All') {
      result = result.filter((app) => app.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (app) =>
          app.company?.name?.toLowerCase().includes(q) ||
          app.drive?.company?.name?.toLowerCase().includes(q) ||
          app.drive?.jobRole?.toLowerCase().includes(q) ||
          app.drive?.title?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applications, activeFilter, search]);

  // Pagination slice
  const totalCount = filteredApplications.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedApplications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, page, pageSize]);

  // Statistics counts
  const overallCount = applications.length;
  const underReviewCount = applications.filter((a) => a.status === 'Under Review' || a.status === 'Applied').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;

  if (loading) {
    return <LoadingSpinner text="Retrieving your placement applications..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Consistent Page Header */}
      <PageHeader
        title="My Placement Applications"
        subtitle="Track your candidate progression, evaluation rounds, and selection offers"
        category="Student Career Services"
        badge={`${overallCount} Applications Submitted`}
        actions={
          <Link to="/student/drives">
            <Button size="sm" icon={ArrowRight}>
              Explore Open Drives
            </Button>
          </Link>
        }
      />

      {/* 2. Mini KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Total Submissions
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {overallCount}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 block uppercase tracking-wider">
            Review / Pending
          </span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">
            {underReviewCount}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-indigo-600 block uppercase tracking-wider">
            Shortlisted
          </span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">
            {shortlistedCount}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 block uppercase tracking-wider">
            Selected Offers
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {selectedCount}
          </span>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs w-full sm:w-auto">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.id === 'All'
                ? applications.length
                : applications.filter((a) => a.status === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* 4. Structured Table or Empty State */}
      {totalCount === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            applications.length === 0
              ? 'No placement applications submitted yet'
              : `No applications match your filter`
          }
          description={
            applications.length === 0
              ? 'Explore open campus placement drives, check your academic eligibility, and apply directly to top employers.'
              : 'Try clearing your search query or selecting a different status filter tab above.'
          }
          actionText={applications.length === 0 ? 'Browse Placement Drives' : 'Reset Filters'}
          actionTo={applications.length === 0 ? '/student/drives' : undefined}
          onAction={
            applications.length > 0
              ? () => {
                  setActiveFilter('All');
                  setSearch('');
                  setPage(1);
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Job Role</th>
                  <th className="py-3 px-4">Package (CTC)</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Application Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApplications.map((app) => {
                  const company = app.company || app.drive?.company;
                  const drive = app.drive;

                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Company Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {company?.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company?.name}
                              className="w-9 h-9 rounded-lg object-contain p-0.5 border border-slate-200 bg-white flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                              {company?.name ? company.name.charAt(0) : 'C'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate leading-tight">
                              {company?.name || 'Company'}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                              {company?.location || drive?.location || 'Campus'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Job Role */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {drive?.jobRole || 'Candidate'}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-xs">
                            {drive?.title}
                          </span>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3.5 px-4 font-bold text-blue-700 whitespace-nowrap">
                        {formatLPA(drive?.packageLPA)}
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(app.appliedAt)}
                      </td>

                      {/* Application Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge status={app.status} size="sm" />
                        {app.currentRound > 1 && (
                          <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                            Round {app.currentRound}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetails(app)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedApp(null);
        }}
        application={selectedApp}
      />
    </div>
  );
};

export default MyApplications;
