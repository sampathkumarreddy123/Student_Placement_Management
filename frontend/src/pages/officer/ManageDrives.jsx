import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Briefcase,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  Users,
  Search,
  CheckCircle,
} from 'lucide-react';
import { driveService } from '../../services/driveService';
import { companyService } from '../../services/companyService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLPA, formatDate } from '../../utils/formatters';

const ALL_DEPTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const ManageDrives = () => {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionAlert, setActionAlert] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    company: '',
    title: '',
    jobRole: '',
    packageLPA: 8.5,
    location: 'Campus / Virtual',
    minCgpa: 6.5,
    maxBacklogs: 0,
    allowedDepartments: ['Computer Science', 'Information Technology'],
    minTenthPercentage: 60,
    minTwelfthPercentage: 60,
    batch: 2026,
    driveDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    registrationDeadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    description: '',
    status: 'Upcoming',
  };

  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drivesRes, compRes] = await Promise.all([
        driveService.getAllDrives(),
        companyService.getCompanies(),
      ]);
      setDrives(drivesRes.drives || []);
      setCompanies(compRes.companies || []);
      if (compRes.companies?.length > 0 && !form.company) {
        setForm((prev) => ({ ...prev, company: compRes.companies[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load drives', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingDriveId(null);
    setForm({
      ...initialForm,
      company: companies[0]?._id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (drive) => {
    setEditingDriveId(drive._id);
    setForm({
      company: drive.company?._id || drive.company,
      title: drive.title,
      jobRole: drive.jobRole,
      packageLPA: drive.packageLPA,
      location: drive.location,
      minCgpa: drive.eligibilityCriteria?.minCgpa ?? 6.5,
      maxBacklogs: drive.eligibilityCriteria?.maxBacklogs ?? 0,
      allowedDepartments: drive.eligibilityCriteria?.allowedDepartments || [],
      minTenthPercentage: drive.eligibilityCriteria?.minTenthPercentage ?? 60,
      minTwelfthPercentage: drive.eligibilityCriteria?.minTwelfthPercentage ?? 60,
      batch: drive.eligibilityCriteria?.batch ?? 2026,
      driveDate: new Date(drive.driveDate).toISOString().split('T')[0],
      registrationDeadline: new Date(drive.registrationDeadline).toISOString().split('T')[0],
      description: drive.description || '',
      status: drive.status,
    });
    setIsModalOpen(true);
  };

  const handleDeptToggle = (dept) => {
    setForm((prev) => {
      const exists = prev.allowedDepartments.includes(dept);
      return {
        ...prev,
        allowedDepartments: exists
          ? prev.allowedDepartments.filter((d) => d !== dept)
          : [...prev.allowedDepartments, dept],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setActionAlert(null);

      const payload = {
        company: form.company,
        title: form.title,
        jobRole: form.jobRole,
        packageLPA: Number(form.packageLPA),
        location: form.location,
        description: form.description,
        driveDate: new Date(form.driveDate),
        registrationDeadline: new Date(form.registrationDeadline),
        status: form.status,
        eligibilityCriteria: {
          minCgpa: Number(form.minCgpa),
          maxBacklogs: Number(form.maxBacklogs),
          allowedDepartments: form.allowedDepartments,
          minTenthPercentage: Number(form.minTenthPercentage),
          minTwelfthPercentage: Number(form.minTwelfthPercentage),
          batch: Number(form.batch),
        },
      };

      if (editingDriveId) {
        await driveService.updateDrive(editingDriveId, payload);
        setActionAlert({ type: 'success', text: 'Placement drive updated successfully!' });
      } else {
        await driveService.createDrive(payload);
        setActionAlert({ type: 'success', text: 'New placement drive announced successfully!' });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) return;

    try {
      setActionAlert(null);
      await driveService.deleteDrive(id);
      setActionAlert({ type: 'success', text: 'Drive deleted successfully.' });
      await fetchData();
    } catch (err) {
      setActionAlert({ type: 'error', text: err.message || 'Failed to delete drive.' });
    }
  };

  const filteredDrives = drives.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.jobRole.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Placement Drive Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, and configure criteria for on-campus & virtual hiring drives
          </p>
        </div>

        <Button size="sm" icon={Plus} onClick={openCreateModal}>
          Schedule Drive
        </Button>
      </div>

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Filter drives by role, company..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Drives Table */}
      {loading ? (
        <LoadingSpinner text="Loading placement drives list..." />
      ) : filteredDrives.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No placement drives found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click "Schedule Drive" above to create your first drive.
          </p>
        </Card>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Drive & Company</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Criteria</th>
                  <th className="py-3 px-4">Drive Date</th>
                  <th className="py-3 px-4 text-center">Applicants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrives.map((drive) => (
                  <tr key={drive._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {drive.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {drive.company?.name} • {drive.jobRole}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-blue-700">
                      {formatLPA(drive.packageLPA)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Min CGPA: {drive.eligibilityCriteria?.minCgpa ?? 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">
                        Max Backlogs: {drive.eligibilityCriteria?.maxBacklogs ?? 0}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{formatDate(drive.driveDate)}</div>
                      <div className="text-[11px] text-slate-400">
                        Deadline: {formatDate(drive.registrationDeadline)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/officer/applications?driveId=${drive._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Users className="w-3 h-3" />
                        {drive.applicantCount ?? 0}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={drive.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(drive)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Drive"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(drive._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriveId ? 'Edit Placement Drive' : 'Schedule New Placement Drive'}
        subtitle="Specify recruitment criteria, target departments, and package"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Recruiting Company *
              </label>
              <select
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full h-[38px] rounded-lg border border-slate-200 px-3 bg-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Drive Title *"
              placeholder="e.g. Google Campus Hiring 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Job Role *"
              placeholder="e.g. Software Engineer"
              value={form.jobRole}
              onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
              required
            />

            <Input
              label="CTC / Package (LPA) *"
              type="number"
              step="0.1"
              placeholder="12.5"
              value={form.packageLPA}
              onChange={(e) => setForm({ ...form, packageLPA: e.target.value })}
              required
            />

            <Input
              label="Job Location"
              placeholder="e.g. Bengaluru / Hybrid"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* Eligibility Criteria Block */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <p className="font-semibold text-slate-800">Eligibility Filters</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                label="Min CGPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.minCgpa}
                onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
              />

              <Input
                label="Max Backlogs"
                type="number"
                min="0"
                value={form.maxBacklogs}
                onChange={(e) => setForm({ ...form, maxBacklogs: e.target.value })}
              />

              <Input
                label="Min 10th (%)"
                type="number"
                min="0"
                max="100"
                value={form.minTenthPercentage}
                onChange={(e) => setForm({ ...form, minTenthPercentage: e.target.value })}
              />

              <Input
                label="Min 12th (%)"
                type="number"
                min="0"
                max="100"
                value={form.minTwelfthPercentage}
                onChange={(e) => setForm({ ...form, minTwelfthPercentage: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Eligible Departments:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_DEPTS.map((dept) => (
                  <label
                    key={dept}
                    className="flex items-center gap-2 p-1.5 rounded border border-slate-200 bg-white cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.allowedDepartments.includes(dept)}
                      onChange={() => handleDeptToggle(dept)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-700 leading-tight">{dept}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Registration Deadline *"
              type="date"
              value={form.registrationDeadline}
              onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
              required
            />

            <Input
              label="Drive Date *"
              type="date"
              value={form.driveDate}
              onChange={(e) => setForm({ ...form, driveDate: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Drive Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-[38px] rounded-lg border border-slate-200 px-3 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Job Description / Selection Guidelines
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
              placeholder="Outline roles, interview rounds, and preparation instructions..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saving}
            >
              {editingDriveId ? 'Save Changes' : 'Announce Drive'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageDrives;

