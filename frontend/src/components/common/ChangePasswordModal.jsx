import React, { useState } from 'react';
import { Lock, X, CheckCircle2, KeyRound } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import Alert from './Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const minLength = user?.role === 'officer' ? 8 : 6;

    if (!currentPassword) {
      errs.currentPassword = 'Enter your current password';
    }

    if (!newPassword) {
      errs.newPassword = 'Enter a new password';
    } else if (newPassword.length < minLength) {
      errs.newPassword = `Password must be at least ${minLength} characters in length`;
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        currentPassword,
        newPassword,
        confirmPassword,
      };

      await authService.changePassword(payload);

      setSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to change password. Please check your current password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163A5F]/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#DBEAFE] w-full max-w-md p-6 z-10 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DBEAFE]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#172554] shadow-xs">
              <KeyRound className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Change Password</h3>
              <p className="text-[11px] text-[#64748B]">
                Enter your current and new password
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#64748B] hover:text-[#172554] hover:bg-[#F0F7FF] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
            </div>
            <h4 className="text-base font-bold text-[#172554]">Password Updated Successfully</h4>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              Your account password has been updated. You can now use your new password to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" autoComplete="off">
            {error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError('')}
                className="text-xs"
              />
            )}

            {/* Current Password */}
            <Input
              label="Current Password"
              id="currentPassword"
              type="password"
              showPasswordToggle
              placeholder="Enter your current password"
              icon={Lock}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (fieldErrors.currentPassword) {
                  setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                }
              }}
              error={fieldErrors.currentPassword}
              required
              autoComplete="current-password"
            />

            {/* New Password */}
            <Input
              label="New Password"
              id="newPassword"
              type="password"
              showPasswordToggle
              placeholder="Enter new password"
              icon={Lock}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                }
              }}
              error={fieldErrors.newPassword}
              helperText={`Minimum ${user?.role === 'officer' ? '8' : '6'} characters`}
              required
              autoComplete="new-password"
            />

            {/* Confirm New Password */}
            <Input
              label="Confirm New Password"
              id="confirmPassword"
              type="password"
              showPasswordToggle
              placeholder="Confirm new password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              error={fieldErrors.confirmPassword}
              required
              autoComplete="new-password"
            />

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#DBEAFE]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
                icon={KeyRound}
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
