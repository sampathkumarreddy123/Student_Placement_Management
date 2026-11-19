import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ListOrdered,
  Plus,
  Calendar,
  Users,
  ArrowRight,
  Edit,
  Trash2,
  Search,
  Laptop,
  Check,
  X,
  FileText,
  Download,
} from 'lucide-react';
import { roundService } from '../../services/roundService';
import { driveService } from '../../services/driveService';
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
import { formatDate, formatLPA } from '../../utils/formatters';
import { getResumeUrl } from '../../utils/imageUrl';
import {
  downloadBlobFile,
  previewBlobFile,
  isJsonErrorBlob,
} from '../../utils/clientPdfGenerator';
import { applicationService } from '../../services/applicationService';

const ROUND_PRESETS = [
  'Online Assessment',
  'Technical Interview 1',
  'Technical Interview 2',
  'Coding Assessment',
  'Group Discussion',
  'Managerial Interview',
  'HR Interview',
  'Final Selection',
];

const ManageRounds = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDriveId = searchParams.get('driveId') || '';

  // Data states
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(initialDriveId);
  const [rounds, setRounds] = useState([]);
  const [driveInfo, setDriveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roundsLoading, setRoundsLoading] = useState(false);

  // Round Create/Edit Modal State
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [roundFormData, setRoundFormData] = useState({
    name: '',
    roundNumber: '',
    description: '',
    date: '',
    mode: 'Online',
    venue: '',
    isFinalRound: false,
    status: 'Scheduled',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Candidate Evaluation Modal State
  const [activeRoundForCandidates, setActiveRoundForCandidates] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateFilter, setCandidateFilter] = useState('All');
  const [evaluatingAppId, setEvaluatingAppId] = useState(null);
  const [advanceLoading, setAdvanceLoading] = useState(false);

  // Remarks Modal State
  const [remarksModalApp, setRemarksModalApp] = useState(null);
  const [evalStatusTarget, setEvalStatusTarget] = useState('');
  const [evalRemarks, setEvalRemarks] = useState('');

  // 1. Fetch all placement drives for the selector
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        setLoading(true);
        const res = await driveService.getAllDrives({ limit: 100 });
        const driveList = res.drives || [];
        setDrives(driveList);

        if (!selectedDriveId && driveList.length > 0) {
          setSelectedDriveId(driveList[0]._id);
        }
      } catch (err) {
        console.error('Failed to load placement drives:', err);
        toast.error(
          err.response?.data?.message || err.message || 'Failed to load placement drives.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDrives();
  }, []);

  // 2. Fetch rounds whenever selectedDriveId changes
  const fetchRounds = async (driveId) => {
    if (!driveId) return;
    try {
      setRoundsLoading(true);
      const res = await roundService.getRoundsByDrive(driveId);
      setRounds(res.rounds || []);
      setDriveInfo(res.drive || null);
    } catch (err) {
      toast.error('Failed to load recruitment rounds for selected drive.');
      setRounds([]);
    } finally {
      setRoundsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDriveId) {
      setSearchParams({ driveId: selectedDriveId });
      fetchRounds(selectedDriveId);
    }
  }, [selectedDriveId]);

  // Resume preview and download handlers
  const handlePreviewCandidateResume = async (cand) => {
    const student = cand.student || {};
    const candidateName = student.name || 'Candidate';
    const applicationId = cand.applicationId;

    if (!student.resumeUrl && !cand.resumeUrl) {
      toast.warning(`No resume document uploaded for ${candidateName}.`);
      return;
    }

    if (applicationId) {
      try {
        const res = await applicationService.previewApplicantResume(applicationId);
        const isError = await isJsonErrorBlob(res.data);
        if (!isError && res.data && res.data.size > 100) {
          previewBlobFile(new Blob([res.data], { type: 'application/pdf' }));
          return;
        }
      } catch (err) {
        console.warn('Backend preview failed:', err);
      }
    }

    toast.error(`Original resume file is not available on server for ${candidateName}.`);
  };

  const handleDownloadCandidateResume = async (cand) => {
    const student = cand.student || {};
    const candidateName = (student.name || 'Candidate').replace(/\s+/g, '_');
    const filename = `${candidateName}_Resume.pdf`;
    const applicationId = cand.applicationId;

    if (!student.resumeUrl && !cand.resumeUrl) {
      toast.warning(`No resume document uploaded for ${student.name || 'this candidate'}.`);
      return;
    }

    if (applicationId) {
      try {
        const res = await applicationService.downloadApplicantResume(applicationId);
        const isError = await isJsonErrorBlob(res.data);
        if (!isError && res.data && res.data.size > 100) {
          downloadBlobFile(new Blob([res.data], { type: 'application/pdf' }), filename);
          toast.success(`Resume downloaded for ${candidateName}.`);
          return;
        }
      } catch (err) {
        console.warn('Backend download failed:', err);
      }
    }

    toast.error(`Original resume file is not available on server for ${candidateName}.`);
  };

  // Open Add/Edit Round Modal
  const handleOpenRoundModal = (round = null) => {
    if (round) {
      setEditingRound(round);
      setRoundFormData({
        name: round.name || '',
        roundNumber: round.roundNumber || '',
        description: round.description || '',
        date: round.date ? new Date(round.date).toISOString().slice(0, 16) : '',
        mode: round.mode || 'Online',
        venue: round.venue || '',
        isFinalRound: Boolean(round.isFinalRound),
        status: round.status || 'Scheduled',
      });
    } else {
      setEditingRound(null);
      const nextSequence = rounds.length > 0 ? Math.max(...rounds.map((r) => r.roundNumber)) + 1 : 1;
      setRoundFormData({
        name: '',
        roundNumber: nextSequence,
        description: '',
        date: '',
        mode: 'Online',
        venue: '',
        isFinalRound: false,
        status: 'Scheduled',
      });
    }
    setIsRoundModalOpen(true);
  };

  // Submit Round Form
  const handleSaveRound = async (e) => {
    e.preventDefault();
    if (!roundFormData.name.trim()) {
      toast.error('Round name is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingRound) {
        await roundService.updateRound(editingRound._id, roundFormData);
        toast.success(`Round ${roundFormData.roundNumber} updated successfully.`);
      } else {
        await roundService.createRound(selectedDriveId, roundFormData);
        toast.success(`Round ${roundFormData.roundNumber} created successfully.`);
      }
      setIsRoundModalOpen(false);
      fetchRounds(selectedDriveId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save round.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Round
  const handleDeleteRound = async (round) => {
    if (!window.confirm(`Are you sure you want to delete Round ${round.roundNumber}: "${round.name}"?`)) {
      return;
    }
    try {
      await roundService.deleteRound(round._id);
      toast.success(`Round ${round.roundNumber} deleted.`);
      fetchRounds(selectedDriveId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete round.');
    }
  };

  // Open Candidate Evaluation Drawer
  const handleOpenCandidates = async (round) => {
    setActiveRoundForCandidates(round);
    setCandidateSearch('');
    setCandidateFilter('All');
    try {
      setCandidatesLoading(true);
      const res = await roundService.getRoundCandidates(round._id);
      setCandidates(res.candidates || []);
    } catch (err) {
      toast.error('Failed to load candidate evaluations for this round.');
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Submit Candidate Evaluation
  const handleEvaluate = async (applicationId, status, remarks = '') => {
    if (!activeRoundForCandidates) return;
    try {
      setEvaluatingAppId(applicationId);
      await roundService.evaluateCandidate(activeRoundForCandidates._id, applicationId, {
        status,
        remarks,
      });

      // Update candidate in local state
      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId
            ? { ...c, roundStatus: status, remarks }
            : c
        )
      );

      toast.success(`Candidate marked as "${status}".`);
      setRemarksModalApp(null);
      // Refresh rounds to update statistics
      fetchRounds(selectedDriveId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation update failed.');
    } finally {
      setEvaluatingAppId(null);
    }
  };

  // Move all Passed candidates to Next Round
  const handleMoveQualified = async () => {
    if (!activeRoundForCandidates) return;
    const passedCount = candidates.filter((c) => c.roundStatus === 'Passed').length;
    if (passedCount === 0) {
      toast.warning('No candidates are currently marked as "Passed" to advance.');
      return;
    }

    if (
      !window.confirm(
        `Advance ${passedCount} qualified candidate(s) to Round ${activeRoundForCandidates.roundNumber + 1}? They will receive an automated notification and college email.`
      )
    ) {
      return;
    }

    try {
      setAdvanceLoading(true);
      const res = await roundService.moveQualified(activeRoundForCandidates._id);
      toast.success(res.message || 'Qualified candidates advanced successfully.');
      handleOpenCandidates(activeRoundForCandidates);
      fetchRounds(selectedDriveId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to advance candidates.');
    } finally {
      setAdvanceLoading(false);
    }
  };

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (candidateFilter !== 'All') {
      list = list.filter((c) => c.roundStatus === candidateFilter);
    }
    if (candidateSearch.trim()) {
      const q = candidateSearch.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.student?.name?.toLowerCase().includes(q) ||
          c.student?.rollNumber?.toLowerCase().includes(q) ||
          c.student?.email?.toLowerCase().includes(q) ||
          c.student?.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [candidates, candidateFilter, candidateSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner text="Loading Recruitment Round Management..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Recruitment Round Management"
        subtitle="Configure recruitment stages, evaluate candidate performance, and advance qualified students through the hiring pipeline."
        breadcrumbs={[
          { label: 'Officer Dashboard', to: '/officer/dashboard' },
          { label: 'Recruitment Rounds' },
        ]}
        actions={
          selectedDriveId && (
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={() => handleOpenRoundModal()}
            >
              Add Recruitment Round {rounds.length > 0 ? `(Round ${Math.max(...rounds.map((r) => r.roundNumber)) + 1})` : ''}
            </Button>
          )
        }
      />

      {/* Drive Selector Bar */}
      <Card className="p-4 bg-white border border-[#DBEAFE] shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1.5">
              Select Placement Drive to Manage Rounds
            </label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full text-xs font-medium text-[#172554] bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {drives.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.company?.name || 'Company'} — {d.jobRole || d.title} ({formatLPA(d.packageLPA)})
                </option>
              ))}
            </select>
          </div>

          {driveInfo && (
            <div className="flex items-center gap-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl px-4 py-2.5 w-full md:w-auto text-xs">
              <div>
                <span className="text-[10px] text-[#64748B] block font-medium">Drive Role</span>
                <span className="font-bold text-[#172554]">{driveInfo.jobRole || driveInfo.title}</span>
              </div>
              <div className="h-6 w-px bg-[#DBEAFE]" />
              <div>
                <span className="text-[10px] text-[#64748B] block font-medium">Status</span>
                <Badge status={driveInfo.status} size="sm" />
              </div>
              <div className="h-6 w-px bg-[#DBEAFE]" />
              <div>
                <span className="text-[10px] text-[#64748B] block font-medium">Total Rounds</span>
                <span className="font-bold text-[#2563EB]">{rounds.length} Rounds</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Rounds List & Pipeline */}
      {roundsLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Fetching drive rounds..." />
        </div>
      ) : rounds.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No Recruitment Rounds Configured"
          message="Create the first recruitment round (e.g., Online Assessment, Technical Interview, HR Round) to begin managing candidate progression."
          actionText="Create Round 1"
          onAction={() => handleOpenRoundModal()}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172554] flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-[#2563EB]" />
              Recruitment Pipeline Stages ({rounds.length})
            </h3>
            <span className="text-xs text-[#64748B]">
              Ordered sequentially from Round 1 to Final Offer
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {rounds.map((round, idx) => (
              <Card
                key={round._id}
                className={`p-5 transition-all border ${
                  round.isFinalRound
                    ? 'border-[#0D9488]/40 bg-gradient-to-r from-white via-white to-[#0D9488]/5 shadow-sm'
                    : 'border-[#DBEAFE] bg-white shadow-sm hover:border-[#2563EB]/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Round Info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${
                        round.isFinalRound
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-[#163A5F] text-white'
                      }`}
                    >
                      {round.roundNumber}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-[#172554] tracking-tight">
                          {round.name}
                        </h4>
                        {round.isFinalRound && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30">
                            Final Round • Offers Extended
                          </span>
                        )}
                        <Badge
                          variant={round.status === 'Completed' ? 'success' : 'info'}
                          size="sm"
                        >
                          {round.status}
                        </Badge>
                      </div>

                      {round.description && (
                        <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
                          {round.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                          {round.date ? formatDate(round.date) : 'Date TBA'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-[#2563EB]" />
                          {round.mode} {round.venue ? `• ${round.venue}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Candidate Stats Pill */}
                  <div className="flex items-center gap-2 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-2.5 self-start lg:self-center">
                    <div className="px-3 text-center">
                      <span className="text-[10px] text-[#64748B] block font-semibold">Total</span>
                      <span className="text-sm font-bold text-[#172554]">
                        {round.stats?.totalCandidates || 0}
                      </span>
                    </div>
                    <div className="h-7 w-px bg-[#DBEAFE]" />
                    <div className="px-3 text-center">
                      <span className="text-[10px] text-[#0D9488] block font-semibold">Passed</span>
                      <span className="text-sm font-bold text-[#0D9488]">
                        {round.stats?.passedCount || 0}
                      </span>
                    </div>
                    <div className="h-7 w-px bg-[#DBEAFE]" />
                    <div className="px-3 text-center">
                      <span className="text-[10px] text-[#DC2626] block font-semibold">Failed</span>
                      <span className="text-sm font-bold text-[#DC2626]">
                        {round.stats?.failedCount || 0}
                      </span>
                    </div>
                    <div className="h-7 w-px bg-[#DBEAFE]" />
                    <div className="px-3 text-center">
                      <span className="text-[10px] text-[#D97706] block font-semibold">Pending</span>
                      <span className="text-sm font-bold text-[#D97706]">
                        {round.stats?.pendingCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Users}
                      onClick={() => handleOpenCandidates(round)}
                    >
                      Manage Candidates
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleOpenRoundModal(round)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-[#DC2626] hover:bg-red-50"
                      onClick={() => handleDeleteRound(round)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Round Modal */}
      <Modal
        isOpen={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        title={
          editingRound
            ? `Edit Round ${editingRound.roundNumber}: ${editingRound.name}`
            : `Create Round #${roundFormData.roundNumber || (rounds.length > 0 ? Math.max(...rounds.map((r) => r.roundNumber)) + 1 : 1)}`
        }
        subtitle="Define assessment format, schedule, and stage requirements"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveRound} className="space-y-4">
          {editingRound && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>Editing existing <strong>Round {editingRound.roundNumber} ({editingRound.name})</strong>.</span>
              <button
                type="button"
                onClick={() => handleOpenRoundModal()}
                className="font-bold underline text-[#2563EB] hover:text-[#163A5F]"
              >
                Switch to Add Next Round &rarr;
              </button>
            </div>
          )}
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-[#172554] mb-1.5">
              Quick Round Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ROUND_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setRoundFormData((prev) => ({ ...prev, name: preset }))}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
                    roundFormData.name === preset
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-[#EFF6FF] text-[#163A5F] border-[#DBEAFE] hover:border-[#2563EB]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Round Title / Name"
                value={roundFormData.name}
                onChange={(e) => setRoundFormData({ ...roundFormData, name: e.target.value })}
                placeholder="e.g. Technical Interview 1"
                required
              />
            </div>
            <div>
              <Input
                label="Sequence #"
                type="number"
                min="1"
                value={roundFormData.roundNumber}
                onChange={(e) =>
                  setRoundFormData({ ...roundFormData, roundNumber: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Scheduled Date & Time"
                type="datetime-local"
                value={roundFormData.date}
                onChange={(e) => setRoundFormData({ ...roundFormData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1">
                Conducting Mode
              </label>
              <select
                value={roundFormData.mode}
                onChange={(e) => setRoundFormData({ ...roundFormData, mode: e.target.value })}
                className="w-full text-xs font-medium text-[#172554] bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="Online">Online / Remote (Virtual)</option>
                <option value="Offline">Offline / On Campus (Physical)</option>
                <option value="Hybrid">Hybrid Mode</option>
              </select>
            </div>
          </div>

          <Input
            label="Venue / Meeting URL"
            value={roundFormData.venue}
            onChange={(e) => setRoundFormData({ ...roundFormData, venue: e.target.value })}
            placeholder="e.g. Audi-2, Lab 402 or MS Teams / Zoom link"
          />

          <div>
            <label className="block text-xs font-bold text-[#172554] mb-1">
              Instructions & Candidate Requirements
            </label>
            <textarea
              rows="3"
              value={roundFormData.description}
              onChange={(e) =>
                setRoundFormData({ ...roundFormData, description: e.target.value })
              }
              placeholder="e.g. Candidates must bring their college ID, 2 copies of resume, and laptop with IDE configured."
              className="w-full text-xs text-[#172554] bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="p-3 bg-[#F0F7FF] border border-[#DBEAFE] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#172554] block">Final Selection Round</span>
              <span className="text-[11px] text-[#64748B]">
                Passing this round automatically marks candidate as "Selected" and extends offer.
              </span>
            </div>
            <input
              type="checkbox"
              checked={roundFormData.isFinalRound}
              onChange={(e) =>
                setRoundFormData({ ...roundFormData, isFinalRound: e.target.checked })
              }
              className="w-4 h-4 text-[#2563EB] rounded border-[#DBEAFE] focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DBEAFE]">
            <Button variant="ghost" size="sm" onClick={() => setIsRoundModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formSubmitting}>
              {editingRound ? 'Update Round' : 'Create Round'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Candidate Evaluation & Progression Drawer */}
      <Modal
        isOpen={Boolean(activeRoundForCandidates)}
        onClose={() => setActiveRoundForCandidates(null)}
        title={
          activeRoundForCandidates
            ? `Round ${activeRoundForCandidates.roundNumber}: ${activeRoundForCandidates.name}`
            : 'Candidate Evaluation'
        }
        subtitle="Evaluate students, record remarks, and advance qualified candidates to subsequent rounds"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#DBEAFE]">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search candidate by name, roll..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <select
                value={candidateFilter}
                onChange={(e) => setCandidateFilter(e.target.value)}
                className="text-xs bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg px-2.5 py-1.5 text-[#172554] font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Evaluation</option>
                <option value="Passed">Passed (Qualified)</option>
                <option value="Failed">Failed / Not Shortlisted</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            {!activeRoundForCandidates?.isFinalRound && (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                isLoading={advanceLoading}
                onClick={handleMoveQualified}
              >
                Advance All Qualified to Next Round
              </Button>
            )}
          </div>

          {/* Candidates Table */}
          {candidatesLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner text="Loading candidates..." />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B] bg-[#EFF6FF] rounded-xl border border-[#DBEAFE]">
              No candidates found matching the criteria for this round.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#DBEAFE]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#163A5F] text-white">
                    <th className="py-2.5 px-3 font-semibold">Candidate</th>
                    <th className="py-2.5 px-3 font-semibold">Academic Credentials</th>
                    <th className="py-2.5 px-3 font-semibold">Resume</th>
                    <th className="py-2.5 px-3 font-semibold">Round Result</th>
                    <th className="py-2.5 px-3 font-semibold">Officer Remarks</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Evaluate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DBEAFE] bg-white">
                  {filteredCandidates.map((cand) => (
                    <tr key={cand.applicationId} className="hover:bg-[#F0F7FF] transition-colors">
                      {/* Candidate info */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#172554] block">
                          {cand.student?.name}
                        </span>
                        <span className="text-[11px] text-[#64748B] block">
                          {cand.student?.email}
                        </span>
                      </td>

                      {/* Academics */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#163A5F] block">
                          Roll: {cand.student?.rollNumber}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate max-w-[140px]">
                          {cand.student?.department} • CGPA {cand.student?.cgpa}
                        </span>
                      </td>

                      {/* Resume */}
                      <td className="py-2.5 px-3">
                        {cand.student?.resumeUrl ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePreviewCandidateResume(cand)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                              title="Show / Preview Resume"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadCandidateResume(cand)}
                              className="text-[#0D9488] hover:text-[#0f172a] p-0.5 rounded transition-colors"
                              title="Download Candidate Resume"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">None</span>
                        )}
                      </td>

                      {/* Round Status */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cand.roundStatus === 'Passed'
                              ? 'bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/30'
                              : cand.roundStatus === 'Failed'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : cand.roundStatus === 'Absent'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {cand.roundStatus === 'Passed' && <Check className="w-3 h-3" />}
                          {cand.roundStatus === 'Failed' && <X className="w-3 h-3" />}
                          {cand.roundStatus}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-[#64748B] block max-w-xs truncate">
                          {cand.remarks || <span className="italic text-[#94A3B8]">No remarks</span>}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            title="Mark as Passed"
                            disabled={evaluatingAppId === cand.applicationId}
                            onClick={() => {
                              setRemarksModalApp(cand);
                              setEvalStatusTarget('Passed');
                              setEvalRemarks(cand.remarks || '');
                            }}
                            className="p-1.5 rounded-md bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488] hover:text-white transition-all disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Mark as Failed"
                            disabled={evaluatingAppId === cand.applicationId}
                            onClick={() => {
                              setRemarksModalApp(cand);
                              setEvalStatusTarget('Failed');
                              setEvalRemarks(cand.remarks || '');
                            }}
                            className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Edit Feedback & Remarks"
                            onClick={() => {
                              setRemarksModalApp(cand);
                              setEvalStatusTarget(cand.roundStatus || 'Pending');
                              setEvalRemarks(cand.remarks || '');
                            }}
                            className="p-1.5 rounded-md bg-[#EFF6FF] text-[#163A5F] hover:bg-[#DBEAFE] transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-[#DBEAFE]">
            <Button variant="ghost" size="sm" onClick={() => setActiveRoundForCandidates(null)}>
              Close Evaluation
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Evaluation & Remarks Feedback Modal */}
      <Modal
        isOpen={Boolean(remarksModalApp)}
        onClose={() => setRemarksModalApp(null)}
        title={`Evaluate: ${remarksModalApp?.student?.name}`}
        subtitle={`Candidate Roll #${remarksModalApp?.student?.rollNumber} • ${activeRoundForCandidates?.name}`}
        maxWidth="max-w-md"
      >
        {remarksModalApp && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEvaluate(remarksModalApp.applicationId, evalStatusTarget, evalRemarks);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1">
                Round Outcome / Status
              </label>
              <select
                value={evalStatusTarget}
                onChange={(e) => setEvalStatusTarget(e.target.value)}
                className="w-full text-xs font-medium text-[#172554] bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="Passed">Passed (Qualified for Next Stage)</option>
                <option value="Failed">Failed (Not Cleared)</option>
                <option value="Pending">Pending (Under Evaluation)</option>
                <option value="Absent">Absent (Did Not Attend)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1">
                Round-Specific Feedback / Officer Remarks
              </label>
              <textarea
                rows="3"
                value={evalRemarks}
                onChange={(e) => setEvalRemarks(e.target.value)}
                placeholder="e.g. Excellent problem solving in graphs and DP. Recommended for Technical Round 2."
                className="w-full text-xs text-[#172554] bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#DBEAFE] text-[11px] text-[#64748B]">
              {evalStatusTarget === 'Passed' && activeRoundForCandidates?.isFinalRound ? (
                <span className="text-[#0D9488] font-semibold">
                  🎉 Final Round: Student will automatically be marked as "Selected", and an official selection notice will be issued.
                </span>
              ) : evalStatusTarget === 'Passed' ? (
                <span>Student will be marked as qualified to proceed to the next round.</span>
              ) : evalStatusTarget === 'Failed' ? (
                <span className="text-red-600 font-medium">
                  Student's application status will be updated to "Rejected".
                </span>
              ) : (
                <span>Evaluation will remain in pending state.</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DBEAFE]">
              <Button variant="ghost" size="sm" onClick={() => setRemarksModalApp(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={evaluatingAppId === remarksModalApp.applicationId}
              >
                Save Evaluation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ManageRounds;
