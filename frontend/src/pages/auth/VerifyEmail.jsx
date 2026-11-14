import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Mail,
  GraduationCap,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmail = () => {
  const { token } = useParams();
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token) {
        setErrorMessage('Verification token is missing from the link.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await authService.verifyEmail(token);
        if (isMounted) {
          setSuccess(true);
          // Refresh session to update isEmailVerified flag
          if (checkAuth) {
            await checkAuth();
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message ||
              err.message ||
              'Invalid or expired email verification link.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, checkAuth]);

  const handleResend = async (e) => {
    e.preventDefault();
    const targetEmail = resendEmail.trim() || user?.email;

    if (!targetEmail) {
      setResendError('Please enter your registered college email.');
      return;
    }

    try {
      setResendLoading(true);
      setResendError('');
      setResendSuccess('');
      const res = await authService.resendVerification(targetEmail);
      setResendSuccess(
        res.message || 'A fresh verification email has been sent. Please check your inbox.'
      );
    } catch (err) {
      setResendError(
        err.response?.data?.message ||
          err.message ||
          'Failed to resend verification link. Please try again later.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DBEAFE]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#172554] text-sm tracking-tight">
            CampusPlacement
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-[#64748B] hover:text-[#172554] transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mx-auto" />
          <h2 className="text-base font-bold text-[#172554]">
            Verifying Your College Email
          </h2>
          <p className="text-xs text-[#64748B]">
            Please wait while we validate your security verification token...
          </p>
        </div>
      ) : success ? (
        <div className="py-3 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#0D9488] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Email Verified Successfully!
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-sm mx-auto">
              Your college email address has been confirmed. You are now eligible to apply for all active campus placement drives and receive notifications.
            </p>
          </div>

          <div className="pt-3">
            {user ? (
              <Button
                variant="primary"
                onClick={() => navigate('/student/drives')}
                className="w-full text-xs"
                icon={ArrowRight}
              >
                Browse Placement Drives
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => navigate('/student/login')}
                className="w-full text-xs"
                icon={ArrowRight}
              >
                Sign In to Student Account
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6 text-[#DC2626]" />
            </div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Verification Link Expired or Invalid
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
              {errorMessage ||
                'This email verification token has expired or has already been used. Please request a new link below.'}
            </p>
          </div>

          {resendSuccess && (
            <Alert type="success" message={resendSuccess} className="text-xs" />
          )}

          {resendError && (
            <Alert type="error" message={resendError} className="text-xs" />
          )}

          <form onSubmit={handleResend} className="space-y-3 pt-2">
            <Input
              label="Enter Your Registered College Email"
              id="resendEmail"
              name="resendEmail"
              type="email"
              placeholder=""
              icon={Mail}
              value={resendEmail || (user?.email || '')}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full text-xs"
              isLoading={resendLoading}
              icon={Mail}
            >
              {resendLoading ? 'Sending Fresh Link...' : 'Resend Verification Link'}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <Link
              to="/student/login"
              className="text-xs font-bold text-[#2563EB] hover:text-[#163A5F] hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
