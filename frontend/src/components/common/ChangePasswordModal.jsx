import React, { useState } from 'react';
import { Lock, X, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    if (!currentPassword) {
      errs.currentPassword = 'Enter your current password';
    }

    const minLength = user?.role === 'officer' ? 8 : 6;
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

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errs.newPassword = 'New password must be different from current password';
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
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to change password. Please verify your current password.'
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
      <div
        className="fixed inset-0"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#DBEAFE] w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DBEAFE]/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Change Password</h3>
              <p className="text-[11px] text-[#64748B]">
                Update credentials for {user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#64748B] hover:text-[#172554] hover:bg-[#F0F7FF] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
            </div>
            <h4 className="text-sm font-bold text-[#172554]">Password Changed</h4>
            <p className="text-xs text-[#64748B]">
              Your password has been successfully updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3" autoComplete="off">
            {error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError('')}
                className="text-xs"
              />
            )}

            <Input
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder=""
              icon={Lock}
              showPasswordToggle
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (fieldErrors.currentPassword) {
                  setFieldErrors({ ...fieldErrors, currentPassword: '' });
                }
              }}
              error={fieldErrors.currentPassword}
              required
              autoComplete="current-password"
            />

            <Input
              label={`New Password (min ${user?.role === 'officer' ? 8 : 6} characters)`}
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder=""
              icon={Lock}
              showPasswordToggle
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors({ ...fieldErrors, newPassword: '' });
                }
              }}
              error={fieldErrors.newPassword}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm New Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder=""
              icon={Lock}
              showPasswordToggle
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                }
              }}
              error={fieldErrors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DBEAFE]/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
