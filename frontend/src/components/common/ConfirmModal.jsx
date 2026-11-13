import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Please Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger, warning, primary
  isLoading = false,
  confirmIcon,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {title}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'warning' ? 'primary' : variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            icon={confirmIcon}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

