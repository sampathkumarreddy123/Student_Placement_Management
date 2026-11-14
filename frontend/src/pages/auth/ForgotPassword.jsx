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
      await authService.forgotPassword(email.trim());
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
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8DED2]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#44352D] flex items-center justify-center text-[#F1E7D9] shadow-sm">
            <KeyRound className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#44352D] text-sm tracking-tight">
            CampusPlacement
          </span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-[#82776C] hover:text-[#44352D] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>

      {submitted ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-xl bg-[#F1E7D9] border border-[#E8DED2] text-[#76543D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#27845B]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#44352D] tracking-tight">
              Reset Link Dispatched
            </h2>
            <p className="text-xs text-[#82776C] mt-1 leading-relaxed max-w-sm mx-auto">
              If an account with <strong>{email}</strong> is registered, we have sent a secure password reset link to it. The link remains valid for <strong>1 hour</strong>.
            </p>
          </div>

          <div className="p-3 bg-[#FAF8F4] border border-[#E8DED2] rounded-lg text-left text-xs text-[#82776C] space-y-1">
            <p className="font-bold text-[#44352D]">Did not receive the email?</p>
            <ul className="list-disc list-inside space-y-0.5 text-[#82776C]">
              <li>Check your spam or junk folder.</li>
              <li>Verify that you entered your registered email correctly.</li>
              <li>Requests are rate-limited to prevent abuse.</li>
            </ul>
          </div>

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
              to="/login"
              className="text-xs font-bold text-[#44352D] hover:text-[#76543D] hover:underline pt-2 block"
            >
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#44352D] tracking-tight">
              Forgot Password
            </h2>
            <p className="text-xs text-[#82776C] mt-0.5">
              Enter your registered email address to receive password reset instructions.
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
              label="Registered Email Address"
              id="email"
              name="email"
              type="email"
              placeholder=""
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
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E8DED2] text-center text-xs space-y-1">
            <p className="text-[#82776C]">
              Remembered your credentials?{' '}
              <Link
                to="/student/login"
                className="font-bold text-[#44352D] hover:text-[#76543D] hover:underline"
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
