import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setFieldError('Email address is required');
      return false;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setFieldError('Please enter a valid email format');
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      if (res?.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to dispatch reset email. Please try again later.'
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

      {submitted ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#0D9488] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Reset Link Dispatched
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-sm mx-auto">
              If an account with <strong>{email}</strong> is registered, we have dispatched a secure password reset link to it. The link remains valid for <strong>60 minutes</strong> and can only be used once.
            </p>
          </div>

          <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-left text-xs text-[#64748B] space-y-1">
            <p className="font-bold text-[#172554]">Did not receive the email in Outlook?</p>
            <ul className="list-disc list-inside space-y-0.5 text-[#64748B]">
              <li>Check your Junk / Spam / Quarantine folder.</li>
              <li>Confirm you entered your registered college roll email correctly.</li>
              <li>Password reset links are time-limited to 60 minutes for security.</li>
            </ul>
          </div>

          {devResetUrl && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs space-y-1.5 shadow-sm">
              <span className="font-bold text-amber-900 block">
                Direct Password Reset Link (Testing Fallback):
              </span>
              <p className="text-[11px] text-amber-700">
                Because external SMTP is offline or port-restricted on this environment, use this direct link to complete the reset:
              </p>
              <a
                href={devResetUrl}
                className="text-[#2563EB] hover:text-[#163A5F] underline font-medium break-all block"
              >
                {devResetUrl}
              </a>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="w-full text-xs"
            >
              Try another email address
            </Button>
            <Link
              to="/student/login"
              className="text-xs font-bold text-[#2563EB] hover:text-[#163A5F] hover:underline pt-2 block"
            >
              Return to Student Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Forgot Password
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter your registered MITS college email address to receive password reset instructions.
            </p>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="College Email Address"
              id="email"
              name="email"
              type="email"
              placeholder="e.g. 25695A0550@mits.ac.in"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError('');
              }}
              error={fieldError}
              required
              autoComplete="off"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={loading}
              icon={KeyRound}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center text-xs space-y-1">
            <p className="text-[#64748B]">
              Remembered your credentials?{' '}
              <Link
                to="/student/login"
                className="font-bold text-[#2563EB] hover:text-[#163A5F] hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;
