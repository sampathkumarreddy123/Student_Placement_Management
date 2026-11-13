import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Eye,
  Send,
  XCircle,
  Archive,
  GraduationCap,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  X,
  PlusCircle,
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
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatLPA, formatDate, getDeadlineStatus } from '../../utils/formatters';

const ALL_DEPTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Internship',
  'Internship + Full-Time',
  'Contract',
];

const DEFAULT_ROUNDS = [
  { roundNumber: 1, roundName: 'Online Assessment', description: 'Technical & Aptitude test' },
  { roundNumber: 2, roundName: 'Technical Interview', description: 'Problem solving & core domain' },
  { roundNumber: 3, roundName: 'HR & Final Interview', description: 'Behavioral & cultural fit' },
];

const ManageDrives = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionAlert, setActionAlert] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const initialForm = {
    company: '',
    title: '',
    jobRole: '',
    jobDescription: '',
    employmentType: 'Full-Time',
    packageLPA: 8.5,
    location: 'Campus / Virtual',
    vacancies: 5,
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    minCgpa: 6.5,
    minTenthPercentage: 60,
    minTwelfthPercentage: 60,
    batch: 2026,
    maxActiveBacklogs: 0,
    maxTotalBacklogs: 0,
    allowedDepartments: ['Computer Science', 'Information Technology'],
    applicationOpeningDate: new Date().toISOString().split('T')[0],
    applicationClosingDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    driveDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    rounds: DEFAULT_ROUNDS,
    status: 'Draft',
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
    } catch (err) {
      console.error('Failed to load drives', err);
      setActionAlert({ type: 'error', text: 'Failed to fetch drives data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new' && companies.length > 0) {
      openCreateModal();
    }
  }, [searchParams, companies]);

  const openCreateModal = () => {
    setEditingDriveId(null);
    setForm({
      ...initialForm,
      company: companies[0]?._id || '',
    });
    setSkillInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (drive) => {
    setEditingDriveId(drive._id);
    const openingStr = drive.applicationOpeningDate
      ? new Date(drive.applicationOpeningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const closingStr = drive.applicationClosingDate || drive.registrationDeadline
      ? new Date(drive.applicationClosingDate || drive.registrationDeadline).toISOString().split('T')[0]
      : '';
    const driveStr = drive.driveDate
      ? new Date(drive.driveDate).toISOString().split('T')[0]
      : '';

    setForm({
      company: drive.company?._id || drive.company,
      title: drive.title || '',
      jobRole: drive.jobRole || '',
      jobDescription: drive.jobDescription || drive.description || '',
      employmentType: drive.employmentType || 'Full-Time',
      packageLPA: drive.packageLPA ?? 8.5,
      location: drive.location || 'Campus / Virtual',
      vacancies: drive.vacancies ?? 5,
      requiredSkills: drive.requiredSkills || [],
      minCgpa: drive.eligibilityCriteria?.minCgpa ?? 6.0,
      minTenthPercentage: drive.eligibilityCriteria?.minTenthPercentage ?? 60,
      minTwelfthPercentage: drive.eligibilityCriteria?.minTwelfthPercentage ?? 60,
      batch: drive.eligibilityCriteria?.batch ?? 2026,
      maxActiveBacklogs: drive.eligibilityCriteria?.maxActiveBacklogs ?? drive.eligibilityCriteria?.maxBacklogs ?? 0,
      maxTotalBacklogs: drive.eligibilityCriteria?.maxTotalBacklogs ?? 0,
      allowedDepartments: drive.eligibilityCriteria?.allowedDepartments || [],
      applicationOpeningDate: openingStr,
      applicationClosingDate: closingStr,
      driveDate: driveStr,
      rounds: drive.rounds && drive.rounds.length > 0 ? drive.rounds : DEFAULT_ROUNDS,
      status: drive.status || 'Draft',
    });
    setSkillInput('');
    setIsModalOpen(true);
  };

  // Department Selection Toggle
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

  const handleSelectAllDepts = () => {
    setForm((prev) => ({
      ...prev,
      allowedDepartments: prev.allowedDepartments.length === ALL_DEPTS.length ? [] : [...ALL_DEPTS],
    }));
  };

  // Skills Tag Management
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !form.requiredSkills.includes(val)) {
        setForm((prev) => ({ ...prev, requiredSkills: [...prev.requiredSkills, val] }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  // Rounds Management
  const handleAddRound = () => {
    const nextRoundNumber = form.rounds.length + 1;
    setForm((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          roundNumber: nextRoundNumber,
          roundName: `Round ${nextRoundNumber}`,
          description: '',
        },
      ],
    }));
  };

  const handleRemoveRound = (idx) => {
    setForm((prev) => {
      const updated = prev.rounds.filter((_, i) => i !== idx);
      return {
        ...prev,
        rounds: updated.map((r, i) => ({ ...r, roundNumber: i + 1 })),
      };
    });
  };

  const handleRoundChange = (idx, field, value) => {
    setForm((prev) => {
      const updated = [...prev.rounds];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, rounds: updated };
    });
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company) {
      setActionAlert({ type: 'error', text: 'Please select a company before saving.' });
      return;
    }

    if (new Date(form.applicationClosingDate) <= new Date(form.applicationOpeningDate)) {
      setActionAlert({
        type: 'error',
        text: 'Application closing date must be strictly after the opening date.',
      });
      return;
    }

    try {
      setSaving(true);
      setActionAlert(null);

      const payload = {
        company: form.company,
        title: form.title || undefined,
        jobRole: form.jobRole,
        jobDescription: form.jobDescription,
        description: form.jobDescription,
        employmentType: form.employmentType,
        packageLPA: Number(form.packageLPA),
        location: form.location,
        vacancies: Number(form.vacancies) || 1,
        requiredSkills: form.requiredSkills,
        applicationOpeningDate: new Date(form.applicationOpeningDate),
        applicationClosingDate: new Date(form.applicationClosingDate),
        registrationDeadline: new Date(form.applicationClosingDate),
        driveDate: form.driveDate ? new Date(form.driveDate) : undefined,
        rounds: form.rounds,
        status: form.status,
        eligibilityCriteria: {
          minCgpa: Number(form.minCgpa),
          minTenthPercentage: Number(form.minTenthPercentage),
          minTwelfthPercentage: Number(form.minTwelfthPercentage),
          batch: Number(form.batch),
          maxActiveBacklogs: Number(form.maxActiveBacklogs),
          maxTotalBacklogs: Number(form.maxTotalBacklogs),
          maxBacklogs: Number(form.maxActiveBacklogs),
          allowedDepartments: form.allowedDepartments,
        },
      };

      if (editingDriveId) {
        await driveService.updateDrive(editingDriveId, payload);
        toast.success('Placement drive updated successfully!');
        setActionAlert({ type: 'success', text: 'Placement drive updated successfully!' });
      } else {
        await driveService.createDrive(payload);
        toast.success(`Placement drive created as "${form.status}"!`);
        setActionAlert({
          type: 'success',
          text: `Placement drive created successfully as "${form.status}"!`,
        });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      toast.error(msg);
      setActionAlert({
        type: 'error',
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  // State Transition Quick Actions
  const handlePublish = async (drive) => {
    try {
      setActionAlert(null);
      await driveService.publishDrive(drive._id);
      toast.success(`Drive "${drive.title}" is now Published and live!`);
      setActionAlert({
        type: 'success',
        text: `Drive "${drive.title}" is now Published and live for students!`,
      });
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to publish drive.';
      toast.error(msg);
      setActionAlert({
        type: 'error',
        text: msg,
      });
    }
  };

  const handleClose = async (drive) => {
    if (!window.confirm(`Close applications for "${drive.title}"? Students will no longer be able to apply.`)) {
      return;
    }
    try {
      setActionAlert(null);
      await driveService.closeDrive(drive._id);
      toast.success(`Applications for "${drive.title}" have been closed.`);
      setActionAlert({
        type: 'success',
        text: `Applications for "${drive.title}" have been closed.`,
      });
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to close drive applications.';
      toast.error(msg);
      setActionAlert({
        type: 'error',
        text: msg,
      });
    }
  };

  const handleArchive = async (drive) => {
    if (!window.confirm(`Mark drive "${drive.title}" as Completed / Archived?`)) {
      return;
    }
    try {
      setActionAlert(null);
      await driveService.archiveDrive(drive._id);
      toast.success(`Drive "${drive.title}" has been archived as Completed.`);
      setActionAlert({
        type: 'success',
        text: `Drive "${drive.title}" has been archived as Completed.`,
      });
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to archive drive.';
      toast.error(msg);
      setActionAlert({
        type: 'error',
        text: msg,
      });
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" and all its student applications?`)) {
      return;
    }

    try {
      setActionAlert(null);
      await driveService.deleteDrive(id);
      toast.success('Drive deleted successfully.');
      setActionAlert({ type: 'success', text: 'Drive deleted successfully.' });
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete drive.';
      toast.error(msg);
      setActionAlert({
        type: 'error',
        text: msg,
      });
    }
  };

  // Statistics Summary
  const stats = useMemo(() => {
    const total = drives.length;
    const published = drives.filter((d) => d.status === 'Published').length;
    const draft = drives.filter((d) => d.status === 'Draft').length;
    const closed = drives.filter((d) => d.status === 'Closed' || d.status === 'Completed').length;
    return { total, published, draft, closed };
  }, [drives]);

  // Filtered drives
  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const matchesSearch =
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.jobRole?.toLowerCase().includes(search.toLowerCase()) ||
        d.location?.toLowerCase().includes(search.toLowerCase()) ||
        (d.requiredSkills && d.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase())));

      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drives, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        category="Recruitment Campaigns"
        title="Placement Drive Management"
        subtitle="Create, publish, monitor, and close on-campus and virtual hiring drives"
        badge={`${stats.total} Total Drives`}
        actions={
          <Button size="sm" icon={Plus} onClick={openCreateModal}>
            Create Drive
          </Button>
        }
      />

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          message={actionAlert.text}
          onClose={() => setActionAlert(null)}
        />
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Drives</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Published / Live</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.published}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Draft Mode</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.draft}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">Closed / Finished</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.closed}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search drives by role, company, skills..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Published', 'Draft', 'Closed', 'Completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Drives Table */}
      {loading ? (
        <LoadingSpinner text="Loading placement drives list..." />
      ) : filteredDrives.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No placement drives found"
          description={
            companies.length === 0
              ? 'Please add companies in the Company Management section before scheduling a drive.'
              : search || statusFilter !== 'All'
              ? 'No drives match your search and filter criteria.'
              : 'Create a new placement drive to begin accepting applications.'
          }
          actionLabel={companies.length > 0 ? 'Create Placement Drive' : undefined}
          onAction={companies.length > 0 ? openCreateModal : undefined}
        />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Drive & Company</th>
                  <th className="py-3 px-4 min-w-[150px]">Role & Package</th>
                  <th className="py-3 px-4 min-w-[160px]">Eligibility</th>
                  <th className="py-3 px-4 min-w-[140px]">Timeline</th>
                  <th className="py-3 px-4 text-center min-w-[90px]">Applicants</th>
                  <th className="py-3 px-4 min-w-[100px]">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[190px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrives.map((drive) => {
                  const deadlineInfo = getDeadlineStatus(drive.applicationClosingDate || drive.registrationDeadline);
                  return (
                    <tr key={drive._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Drive & Company */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          {drive.company?.logoUrl ? (
                            <img
                              src={drive.company.logoUrl}
                              alt={drive.company.name}
                              className="w-8 h-8 rounded-lg object-contain p-0.5 border border-slate-200 bg-white flex-shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                              {drive.company?.name ? drive.company.name.charAt(0) : 'C'}
                            </div>
                          )}
                          <div className="truncate max-w-[170px]">
                            <Link
                              to={`/drives/${drive._id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 leading-tight block truncate"
                            >
                              {drive.title}
                            </Link>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {drive.company?.name || 'Company'} • {drive.location}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Package */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="font-semibold text-blue-700">{formatLPA(drive.packageLPA)}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700 truncate max-w-[90px]">{drive.jobRole}</span>
                          <span>•</span>
                          <span className="text-slate-400">{drive.employmentType || 'Full-Time'}</span>
                        </div>
                        {drive.vacancies ? (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {drive.vacancies} {drive.vacancies === 1 ? 'vacancy' : 'vacancies'}
                          </div>
                        ) : null}
                      </td>

                      {/* Criteria */}
                      <td className="py-3.5 px-4 min-w-[160px] text-slate-600">
                        <div>
                          Min CGPA: <span className="font-medium text-slate-800">{drive.eligibilityCriteria?.minCgpa ?? 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Max Backlogs: {drive.eligibilityCriteria?.maxActiveBacklogs ?? drive.eligibilityCriteria?.maxBacklogs ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                          {drive.eligibilityCriteria?.allowedDepartments?.length || 0} depts allowed
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 min-w-[140px] text-slate-600">
                        <div className="text-[11px]">
                          Close: <span className="font-medium text-slate-800">{formatDate(drive.applicationClosingDate || drive.registrationDeadline)}</span>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              deadlineInfo.isUrgent
                                ? 'bg-amber-50 text-amber-700'
                                : deadlineInfo.isClosed
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {deadlineInfo.text}
                          </span>
                        </div>
                      </td>

                      {/* Applicants */}
                      <td className="py-3.5 px-4 text-center min-w-[90px]">
                        <Link
                          to={`/officer/applications?driveId=${drive._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                          title="View enrolled student applications"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{drive.applicantCount ?? 0}</span>
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 min-w-[100px]">
                        <Badge status={drive.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[190px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Publish button if Draft */}
                          {drive.status === 'Draft' && (
                            <button
                              type="button"
                              onClick={() => handlePublish(drive)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-medium transition-colors border border-emerald-200"
                              title="Publish drive and open for applications"
                            >
                              <Send className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          {/* Close button if Published */}
                          {drive.status === 'Published' && (
                            <button
                              type="button"
                              onClick={() => handleClose(drive)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-medium transition-colors border border-amber-200"
                              title="Close applications"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Close</span>
                            </button>
                          )}

                          {/* Archive button if Closed */}
                          {drive.status === 'Closed' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(drive)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-medium transition-colors border border-purple-200"
                              title="Archive drive as Completed"
                            >
                              <Archive className="w-3 h-3" />
                              <span>Archive</span>
                            </button>
                          )}

                          {/* View details */}
                          <Link
                            to={`/drives/${drive._id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Full Specifications"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(drive)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Drive"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(drive._id, drive.title)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grouped Create / Edit Drive Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriveId ? 'Edit Placement Drive' : 'Create New Placement Drive'}
        subtitle="Configure recruitment details, eligibility criteria, and process rounds"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                Section 1: Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Recruiting Company *
                </label>
                <select
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full h-[38px] rounded-lg border border-slate-200 px-3 bg-white text-xs focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </select>
                {companies.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No companies found. Please add a company in Company Management first.
                  </p>
                )}
              </div>

              <Input
                label="Job Role *"
                placeholder="e.g. Software Engineer / Product Analyst"
                value={form.jobRole}
                onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Drive Title (Optional)"
                placeholder="Defaults to Company - Role"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Employment Type *
                </label>
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                  className="w-full h-[38px] rounded-lg border border-slate-200 px-3 bg-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Package / CTC (LPA) *"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 12.5"
                value={form.packageLPA}
                onChange={(e) => setForm({ ...form, packageLPA: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Job Location"
                placeholder="e.g. Hyderabad / Bengaluru / Remote"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />

              <Input
                label="Vacancies"
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={form.vacancies}
                onChange={(e) => setForm({ ...form, vacancies: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Job Description & Overview
              </label>
              <textarea
                rows={3}
                value={form.jobDescription}
                onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
                placeholder="Role summary, expected responsibilities, day-to-day work..."
              />
            </div>
          </div>

          {/* SECTION 2: ELIGIBILITY CRITERIA */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                Section 2: Academic & Eligibility Criteria
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Min CGPA (0-10)"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.minCgpa}
                onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
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
                label="Min 12th/Dip (%)"
                type="number"
                min="0"
                max="100"
                value={form.minTwelfthPercentage}
                onChange={(e) => setForm({ ...form, minTwelfthPercentage: e.target.value })}
              />

              <Input
                label="Graduation Year"
                type="number"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Max Active Backlogs"
                type="number"
                min="0"
                value={form.maxActiveBacklogs}
                onChange={(e) => setForm({ ...form, maxActiveBacklogs: e.target.value })}
              />

              <Input
                label="Max Total Historical Backlogs"
                type="number"
                min="0"
                value={form.maxTotalBacklogs}
                onChange={(e) => setForm({ ...form, maxTotalBacklogs: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Allowed Departments:
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllDepts}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  {form.allowedDepartments.length === ALL_DEPTS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_DEPTS.map((dept) => (
                  <label
                    key={dept}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-blue-50/50 transition-colors"
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

          {/* SECTION 3: RECRUITMENT DETAILS, TIMELINE & ROUNDS */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                Section 3: Recruitment Timeline & Process
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Application Opening Date *"
                type="date"
                value={form.applicationOpeningDate}
                onChange={(e) => setForm({ ...form, applicationOpeningDate: e.target.value })}
                required
              />

              <Input
                label="Application Closing Date *"
                type="date"
                value={form.applicationClosingDate}
                onChange={(e) => setForm({ ...form, applicationClosingDate: e.target.value })}
                required
              />

              <Input
                label="Drive / Interview Date"
                type="date"
                value={form.driveDate}
                onChange={(e) => setForm({ ...form, driveDate: e.target.value })}
              />
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Required Technical Skills (Press Enter or comma to add)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 min-h-[42px]">
                {form.requiredSkills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk)}
                      className="text-blue-500 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="e.g. Python, SQL..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="flex-1 min-w-[120px] text-xs outline-none bg-transparent py-0.5 px-1"
                />
              </div>
            </div>

            {/* Rounds array */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-700">
                  Recruitment Process Rounds:
                </label>
                <button
                  type="button"
                  onClick={handleAddRound}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Round
                </button>
              </div>

              <div className="space-y-2">
                {form.rounds.map((round, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Round Title (e.g. Coding Assessment)"
                      value={round.roundName}
                      onChange={(e) => handleRoundChange(idx, 'roundName', e.target.value)}
                      className="h-8 px-2.5 rounded-md border border-slate-200 text-xs w-full sm:w-48 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Round Description (e.g. 60 mins 2 problems)"
                      value={round.description}
                      onChange={(e) => handleRoundChange(idx, 'description', e.target.value)}
                      className="h-8 px-2.5 rounded-md border border-slate-200 text-xs flex-1 w-full focus:outline-none focus:border-blue-500"
                    />
                    {form.rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Remove Round"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: DRIVE STATUS */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                Section 4: Drive Visibility & Status
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'Draft',
                  label: 'Draft',
                  desc: 'Hidden from students. Edit freely.',
                },
                {
                  id: 'Published',
                  label: 'Published',
                  desc: 'Live on student portal for applications.',
                },
                {
                  id: 'Closed',
                  label: 'Closed',
                  desc: 'Applications closed for review.',
                },
                {
                  id: 'Completed',
                  label: 'Completed',
                  desc: 'Hiring concluded and archived.',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    form.status === opt.id
                      ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">{opt.label}</span>
                    <input
                      type="radio"
                      name="driveStatus"
                      value={opt.id}
                      checked={form.status === opt.id}
                      onChange={() => setForm({ ...form, status: opt.id })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Action Buttons - Clean bottom bar */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 bg-white sticky bottom-0 -mx-5 -mb-5 p-5 sm:-mx-6 sm:-mb-6 sm:p-6 shadow-sm">
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
              {editingDriveId ? 'Save Changes' : form.status === 'Published' ? 'Create & Publish' : 'Save as Draft'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageDrives;
