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
        return <AlertCircle className="w-5 h-5 text-[#C94C4C]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#C58A32]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#44352D]" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#C94C4C]/10 border-[#C94C4C]/20';
      case 'warning':
        return 'bg-[#C58A32]/10 border-[#C58A32]/20';
      default:
        return 'bg-[#F1E7D9] border-[#E8DED2]';
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
            <h4 className="text-sm font-bold text-[#44352D] leading-snug">
              {title}
            </h4>
            <p className="text-xs text-[#82776C] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8DED2]/60">
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

