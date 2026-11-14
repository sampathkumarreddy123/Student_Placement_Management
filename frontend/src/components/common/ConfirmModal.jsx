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
        return <AlertCircle className="w-5 h-5 text-[#DC2626]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#D97706]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#163A5F]" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#DC2626]/10 border-[#DC2626]/20';
      case 'warning':
        return 'bg-[#D97706]/10 border-[#D97706]/20';
      default:
        return 'bg-[#DBEAFE] border-[#DBEAFE]';
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
            <h4 className="text-sm font-bold text-[#172554] leading-snug">
              {title}
            </h4>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#DBEAFE]/80">
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
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary'}
            size="sm"
            isLoading={isLoading}
            icon={confirmIcon}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
