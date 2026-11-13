import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Input from '../common/Input';
import { applicationService } from '../../services/applicationService';

const STATUS_CHOICES = [
  { value: 'Under Review', label: 'Under Review (Evaluating Candidate Profile)' },
  { value: 'Shortlisted', label: 'Shortlisted (Passed Resume Screening / Round)' },
  { value: 'Selected', label: 'Selected (Final Job Offer Extended / Placed)' },
  { value: 'Rejected', label: 'Rejected (Did Not Advance to Next Round)' },
];

const StatusUpdateModal = ({ isOpen, onClose, application, onSuccess }) => {
  const [status, setStatus] = useState('Under Review');
  const [currentRound, setCurrentRound] = useState(1);
  const [selectionRemarks, setSelectionRemarks] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && application) {
      setStatus(application.status || 'Under Review');
      setCurrentRound(application.currentRound || 1);
      setSelectionRemarks(application.selectionRemarks || '');
      setOfficerNotes(application.officerNotes || '');
      setConfirmed(false);
      setErrorMsg('');
    }
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const previousStatus = application.status || 'Applied';
  const isCriticalStatus = status === 'Selected' || status === 'Rejected';
  const isSameStatus = status === previousStatus;

  // Validation: if critical status selected, require confirmation checkbox
  const canSubmit = !submitting && (!isCriticalStatus || confirmed || isSameStatus);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const updateData = {
        status,
        currentRound: Number(currentRound),
        selectionRemarks: selectionRemarks.trim(),
        officerNotes: officerNotes.trim(),
      };

      const res = await applicationService.updateStatus(application._id, updateData);

      if (onSuccess) {
        onSuccess(res);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to update candidate status.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = application.student?.name || 'Applicant';
  const rollNumber = application.studentProfile?.rollNumber || application.resumeSnapshot?.studentRollNumber || 'N/A';
  const companyName = application.company?.name || application.drive?.company?.name || 'Company';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Candidate Selection Status"
      subtitle={`${studentName} (${rollNumber}) • ${companyName}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
        )}

        {/* Current Status Banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Current Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge status={previousStatus} size="sm" />
              <span className="text-slate-500 font-medium">Round {application.currentRound || 1}</span>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400" />

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Proposed New Status</span>
            <div className="mt-0.5">
              <Badge status={status} size="sm" />
            </div>
          </div>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Select New Status *
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setConfirmed(false);
            }}
            className="w-full h-[38px] rounded-lg border border-slate-200 px-3 bg-white text-xs font-medium focus:outline-none focus:border-blue-500"
          >
            {STATUS_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Round Number */}
        <Input
          label="Current Assessment / Interview Round"
          type="number"
          min="1"
          max="10"
          value={currentRound}
          onChange={(e) => setCurrentRound(e.target.value)}
          placeholder="e.g. 1, 2, 3..."
        />

        {/* Selection Remarks (Visible to student on portal) */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Selection Remarks (Visible to Student on Portal)
          </label>
          <textarea
            rows={2}
            value={selectionRemarks}
            onChange={(e) => setSelectionRemarks(e.target.value)}
            placeholder="e.g. Cleared Technical Round 1; scheduled for HR round on Monday at 10:00 AM."
            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">
            This comment will be displayed to the student in their My Applications portal.
          </p>
        </div>

        {/* Internal Officer Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Internal Officer Notes (Interview feedback / placement records)
          </label>
          <textarea
            rows={2}
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            placeholder="e.g. Recruiter rated candidate strong in data structures, recommended for senior tier."
            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        {/* Critical Status Confirmation Warning */}
        {status === 'Selected' && !isSameStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Final Selection Confirmation</p>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                  Marking this candidate as <strong>Selected</strong> will officially record a placement offer
                  from <strong>{companyName}</strong>. The student's institutional placement status will be updated to <strong>Placed</strong>.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 border-t border-emerald-200/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 border-emerald-300 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-semibold text-emerald-800">
                I verify that this candidate has received and accepted an official placement offer.
              </span>
            </label>
          </div>
        )}

        {status === 'Rejected' && !isSameStatus && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Application Rejection Confirmation</p>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  Marking this candidate as <strong>Rejected</strong> will conclude their consideration
                  for this placement drive. The candidate will see their updated status in their portal.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 border-t border-rose-200/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-600 border-rose-300 focus:ring-rose-500"
              />
              <span className="text-[11px] font-semibold text-rose-800">
                I confirm that this candidate did not meet the criteria to advance further.
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            isLoading={submitting}
          >
            Confirm & Save Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusUpdateModal;
