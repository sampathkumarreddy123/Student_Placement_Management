import React, { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resetToken = (token || searchParams.get('token') || '').trim();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errors = {};
    if (!password) {
      errors.password = 'New password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your new password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetToken) {
      setError('Missing reset token. Please use the exact link sent to your college email.');
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(resetToken, {
        password,
        confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/student/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to reset password. The link may have expired (60-minute limit) or already been used.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DBEAFE]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
            <KeyRound className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#172554] text-sm tracking-tight">
            MITS Placements
          </span>
        </Link>
        <Link
          to="/student/login"
          className="text-xs font-semibold text-[#64748B] hover:text-[#172554] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>

      {!resetToken ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Invalid Reset Link
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-sm mx-auto">
              No reset token was found in the URL. Please ensure you clicked the full link sent to your MITS Outlook inbox.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
            >
              Request a New Reset Link
            </Link>
          </div>
        </div>
      ) : success ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#0D9488] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Password Reset Complete
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Your password has been securely updated. A confirmation has been sent to your registered college email. Directing to sign-in...
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/student/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
            >
              Sign In with New Password
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter and confirm your new secure password. Reset links are valid for 60 minutes.
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert
                type="error"
                message={error}
                onClose={() => setError('')}
              />
              {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
                <div className="mt-2 text-center">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#2563EB] hover:text-[#163A5F] hover:underline"
                  >
                    Request a new password reset link &rarr;
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="New Password"
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              icon={Lock}
              showPasswordToggle
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
              }}
              error={fieldErrors.password}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm New Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
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

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={loading}
              icon={KeyRound}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center text-xs">
            <Link
              to="/student/login"
              className="font-bold text-[#2563EB] hover:text-[#163A5F] transition-colors"
            >
              Return to Student Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ResetPassword;
