import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

  const filteredApplications =
    activeFilter === 'All'
      ? applications
      : applications.filter((app) => app.status === activeFilter);

  // Statistics counts
  const totalCount = applications.length;
  const underReviewCount = applications.filter((a) => a.status === 'Under Review' || a.status === 'Applied').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;

  if (loading) {
    return <LoadingSpinner text="Retrieving your placement applications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your candidate progress, interview rounds, and selection outcomes
          </p>
        </div>

        <Link to="/student/drives">
          <Button size="sm" icon={ArrowRight}>
            Explore Open Drives
          </Button>
        </Link>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Submitted Applications</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-medium text-blue-600 block">Under Review / Pending</span>
          <span className="text-xl font-bold text-blue-700 mt-1 block">{underReviewCount}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-medium text-indigo-600 block">Shortlisted</span>
          <span className="text-xl font-bold text-indigo-700 mt-1 block">{shortlistedCount}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-[11px] font-medium text-emerald-600 block">Selected Offers</span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">{selectedCount}</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 w-fit text-xs">
        {STATUS_FILTERS.map((tab) => {
          const count =
            tab.id === 'All'
              ? applications.length
              : applications.filter((a) => a.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Structured Table */}
      {filteredApplications.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {applications.length === 0
              ? 'No placement applications submitted yet'
              : `No applications with status "${activeFilter}"`}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {applications.length === 0
              ? 'Explore active campus placement drives and apply to positions matching your qualifications.'
              : 'Try selecting a different filter tab above to view your other submissions.'}
          </p>
          {applications.length === 0 && (
            <div className="mt-4">
              <Link to="/student/drives">
                <Button size="sm" icon={Briefcase}>
                  Browse Placement Drives
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredApplications.map((app) => {
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
                          <span className="font-semibold text-slate-800">{drive?.jobRole || 'Candidate'}</span>
                          <span className="text-[11px] text-slate-400">{drive?.title}</span>
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
                          <span className="text-[11px] text-slate-400 block mt-0.5">
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
