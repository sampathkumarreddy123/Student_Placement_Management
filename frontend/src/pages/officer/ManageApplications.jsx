import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  Edit2,
  Users,
  Award,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { driveService } from '../../services/driveService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['Applied', 'Under Review', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'];

const ManageApplications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDriveId = searchParams.get('driveId') || '';

  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(initialDriveId);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState(null);

  // Status Update Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetApp, setTargetApp] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'Applied',
    currentRound: 1,
    selectionRemarks: '',
    officerNotes: '',
  });
  const [updating, setUpdating] = useState(false);

  const fetchDrives = async () => {
    try {
      const res = await driveService.getAllDrives();
      setDrives(res.drives || []);
    } catch (err) {
      console.error('Failed to load drives', err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDriveId) params.driveId = selectedDriveId;
      if (selectedStatus) params.status = selectedStatus;

      const res = await applicationService.getAllApplications(params);
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    fetchApplications();
    if (selectedDriveId) {
      setSearchParams({ driveId: selectedDriveId });
    } else {
      setSearchParams({});
    }
  }, [selectedDriveId, selectedStatus]);

  const openUpdateModal = (app) => {
    setTargetApp(app);
    setStatusForm({
      status: app.status || 'Applied',
      currentRound: app.currentRound || 1,
      selectionRemarks: app.selectionRemarks || '',
      officerNotes: app.officerNotes || '',
    });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setActionAlert(null);
      await applicationService.updateStatus(targetApp._id, statusForm);
      setActionAlert({
        type: 'success',
        text: `Application for ${targetApp.student?.name} updated to ${statusForm.status}!`,
      });
      setIsModalOpen(false);
      await fetchApplications();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message || 'Failed to update application.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Application Review & Shortlisting</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track student submissions, advance candidates across interview rounds, and record final offers
          </p>
        </div>

        <Badge variant="primary" size="lg">
          {applications.length} Submissions
        </Badge>
      </div>

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="w-full h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Placement Drives</option>
            {drives.map((d) => (
              <option key={d._id} value={d._id}>
                {d.title} ({d.company?.name})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-56">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <LoadingSpinner text="Fetching applicant pool..." />
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No applicants found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try switching drive or status filter options.
          </p>
        </Card>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[180px]">Candidate & Roll</th>
                  <th className="py-3 px-4 min-w-[170px]">Target Drive & Company</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">CGPA</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">Round</th>
                  <th className="py-3 px-4 min-w-[110px]">Applied Date</th>
                  <th className="py-3 px-4 min-w-[110px]">Current Status</th>
                  <th className="py-3 px-4 min-w-[150px]">Officer Notes</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {app.student?.name || 'Applicant'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-blue-700 bg-blue-50 px-1 rounded">
                          {app.studentProfile?.rollNumber || 'STU-001'}
                        </span>
                        <span className="ml-1 text-slate-400">
                          ({app.studentProfile?.department})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[170px]">
                      <div className="font-medium text-slate-900">
                        {app.drive?.company?.name || 'Company'}
                      </div>
                      <div className="text-[11px] text-slate-500">{app.drive?.jobRole}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 min-w-[80px]">
                      {app.studentProfile?.cgpa ? app.studentProfile.cgpa.toFixed(2) : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-center min-w-[80px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        R{app.currentRound}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 min-w-[110px]">
                      {formatDate(app.appliedAt)}
                    </td>

                    <td className="py-3.5 px-4 min-w-[110px]">
                      <Badge status={app.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-600 min-w-[150px]">
                      {app.officerNotes || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Edit2}
                        onClick={() => openUpdateModal(app)}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Candidate Status"
        subtitle={`Candidate: ${targetApp?.student?.name} (${targetApp?.studentProfile?.rollNumber})`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Candidate Selection Status *
            </label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="w-full h-[38px] rounded-lg border border-slate-200 px-3 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="Applied">Applied (Initial Submission)</option>
              <option value="Under Review">Under Review (Evaluating Profile)</option>
              <option value="Shortlisted">Shortlisted (Passed Resume Screening)</option>
              <option value="Interviewing">Interviewing (In Active Assessment Rounds)</option>
              <option value="Selected">Selected (Job Offer Accepted / Placed)</option>
              <option value="Rejected">Rejected</option>
            </select>
            {statusForm.status === 'Selected' && (
              <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                Note: Marking "Selected" will automatically update the student's status to "Placed"!
              </p>
            )}
          </div>

          <Input
            label="Current Interview / Assessment Round Number"
            type="number"
            min="1"
            max="10"
            value={statusForm.currentRound}
            onChange={(e) => setStatusForm({ ...statusForm, currentRound: e.target.value })}
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Selection Remarks (Official announcement / outcome notes)
            </label>
            <textarea
              rows={2}
              value={statusForm.selectionRemarks}
              onChange={(e) => setStatusForm({ ...statusForm, selectionRemarks: e.target.value })}
              placeholder="e.g. Extended offer letter for SDE-1; Joining date June 2026."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Officer Notes / Feedback (Visible to Student)
            </label>
            <textarea
              rows={3}
              value={statusForm.officerNotes}
              onChange={(e) => setStatusForm({ ...statusForm, officerNotes: e.target.value })}
              placeholder="e.g. Cleared Technical Round 1; scheduled for HR interview on Friday."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updating}>
              Save Status Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageApplications;

