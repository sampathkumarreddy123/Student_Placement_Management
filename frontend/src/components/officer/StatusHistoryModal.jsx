import React from 'react';
import { History, User, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

const StatusHistoryModal = ({ isOpen, onClose, application }) => {
  if (!isOpen || !application) return null;

  const history = application.statusHistory || [];
  const studentName = application.student?.name || 'Applicant';
  const rollNumber =
    application.studentProfile?.rollNumber ||
    application.resumeSnapshot?.studentRollNumber ||
    'N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Status Audit Trail"
      subtitle={`${studentName} (${rollNumber}) • ${application.drive?.title || 'Placement Drive'}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No status history recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history
              .slice()
              .reverse()
              .map((item, index) => {
                const updatedByName =
                  item.updatedBy?.name || item.updatedBy?.email || 'Placement Officer';

                return (
                  <div key={index} className="relative">
                    {/* Timeline Node */}
                    <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Badge status={item.previousStatus} size="sm" />
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <Badge status={item.newStatus} size="sm" />
                        </div>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.updatedDate
                            ? new Date(item.updatedDate).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Date recorded'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Updated by: <strong className="text-slate-700">{updatedByName}</strong></span>
                      </div>

                      {item.remarks && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-[11px] leading-relaxed">
                          <strong className="block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                            Remarks:
                          </strong>
                          {item.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close History
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatusHistoryModal;

