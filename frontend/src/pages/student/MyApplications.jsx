import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Building2, Calendar, Clock, ExternalLink, ArrowRight } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatLPA } from '../../utils/formatters';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

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

  const statuses = ['All', 'Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'];

  const filtered = filterStatus === 'All'
    ? applications
    : applications.filter((a) => a.status === filterStatus);

  if (loading) {
    return <LoadingSpinner text="Fetching your application submissions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Placement Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your candidate progression, interview rounds, and selection outcomes
          </p>
        </div>

        <Link to="/student/drives">
          <Button size="sm" icon={ArrowRight}>
            Explore More Drives
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-lg border border-slate-200/80 w-fit text-xs">
        {statuses.map((status) => {
          const count =
            status === 'All'
              ? applications.length
              : applications.filter((a) => a.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No applications in this category</h3>
          <p className="text-xs text-slate-500 mt-1">
            Check open placement drives and submit your profile for review.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app._id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                    {app.drive?.company?.name ? app.drive.company.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {app.drive?.company?.name}
                      </h3>
                      <Badge status={app.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Role: <span className="font-medium text-slate-700">{app.drive?.jobRole}</span> •
                      Package: <span className="font-semibold text-blue-600">{formatLPA(app.drive?.packageLPA)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/drives/${app.drive?._id}`}>
                    <Button variant="outline" size="sm">
                      Drive Details
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Progress & Feedback Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Applied On</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {formatDate(app.appliedAt)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Current Round</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    Round {app.currentRound}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {app.drive?.location || 'Campus'}
                  </span>
                </div>
              </div>

              {app.officerNotes && (
                <div className="mt-3 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-xs">
                  <span className="font-semibold text-blue-900">Placement Officer Note: </span>
                  <span className="text-blue-800">{app.officerNotes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;

