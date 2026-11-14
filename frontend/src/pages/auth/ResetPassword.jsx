import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

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

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token, {
        password,
        confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to reset password. The link may have expired or is invalid.'
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
            CampusPlacement
          </span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-[#64748B] hover:text-[#172554] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>

      {success ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#0D9488] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Password Reset Complete
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Your password has been securely updated. You will be redirected to the sign-in page shortly.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
            >
              Sign In Now
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
              Enter and confirm your new secure password.
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
              placeholder=""
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
              to="/login"
              className="font-bold text-[#2563EB] hover:text-[#163A5F] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ResetPassword;
