import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Hash,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Identifier Lookup, 2 = Security Questions, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Identifier Lookup
  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!identifier.trim()) {
      setFieldErrors({ identifier: 'Please enter your college email or roll number' });
      return;
    }

    try {
      setLoading(true);
      const res = await authService.getSecurityQuestions(identifier.trim());

      if (res.success && Array.isArray(res.questions) && res.questions.length === 3) {
        setQuestions(res.questions);
        setAnswers(['', '', '']);
        setStep(2);
      } else {
        setError(res.message || 'Unable to retrieve security questions for this account.');
      }
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.message?.includes('Resource not found')) {
        setError(
          'The security recovery endpoint is not accessible. Please ensure the backend server has been restarted with the latest code (cd backend; npm.cmd run dev).'
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            'No recovery setup found for this account. Please check your details or contact the placement cell.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Answer Verification
  const handleVerifyAnswers = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const newErrors = {};
    answers.forEach((ans, idx) => {
      if (!ans.trim()) {
        newErrors[`answer_${idx}`] = `Please answer question #${idx + 1}`;
      } else if (ans.trim().length < 2) {
        newErrors[`answer_${idx}`] = 'Answer must be at least 2 characters long';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const answersPayload = questions.map((q, idx) => ({
        question: q,
        answer: answers[idx].trim(),
      }));

      const res = await authService.verifySecurityQuestions(
        identifier.trim(),
        answersPayload
      );

      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setStep(3);
      } else {
        setError(res.message || 'Incorrect security answers. Please verify and try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Verification failed. Please verify your answers.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const newErrors = {};
    if (!password) {
      newErrors.password = 'New password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword(resetToken, {
        password,
        confirmPassword,
      });

      if (res.success) {
        setStep(4);
      } else {
        setError(res.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to reset password. The recovery session may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Brand Header */}
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

      {/* Step Progress Indicators (Steps 1 to 3) */}
      {step < 4 && (
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 1
                  ? 'bg-[#172554] text-white shadow-xs'
                  : 'bg-[#EFF6FF] text-[#64748B] border border-[#DBEAFE]'
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-medium ${
                step >= 1 ? 'text-[#172554] font-semibold' : 'text-[#64748B]'
              }`}
            >
              Account
            </span>
          </div>

          <div
            className={`flex-1 h-0.5 mx-2 rounded transition-all ${
              step >= 2 ? 'bg-[#172554]' : 'bg-[#DBEAFE]'
            }`}
          />

          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 2
                  ? 'bg-[#172554] text-white shadow-xs'
                  : 'bg-[#EFF6FF] text-[#64748B] border border-[#DBEAFE]'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-medium ${
                step >= 2 ? 'text-[#172554] font-semibold' : 'text-[#64748B]'
              }`}
            >
              Security Questions
            </span>
          </div>

          <div
            className={`flex-1 h-0.5 mx-2 rounded transition-all ${
              step >= 3 ? 'bg-[#172554]' : 'bg-[#DBEAFE]'
            }`}
          />

          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 3
                  ? 'bg-[#172554] text-white shadow-xs'
                  : 'bg-[#EFF6FF] text-[#64748B] border border-[#DBEAFE]'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-medium ${
                step >= 3 ? 'text-[#172554] font-semibold' : 'text-[#64748B]'
              }`}
            >
              New Password
            </span>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-4"
        />
      )}

      {/* STEP 1: Look up Account */}
      {step === 1 && (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Password Recovery
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter your registered college email address or roll number to retrieve your security questions.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4" autoComplete="off">
            <Input
              label="College Email or Roll Number"
              id="identifier"
              name="identifier"
              placeholder="e.g. 21691A0501 or student@mits.ac.in"
              icon={Mail}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) setFieldErrors({});
              }}
              error={fieldErrors.identifier}
              required
              autoComplete="off"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={loading}
              icon={ShieldCheck}
            >
              {loading ? 'Verifying Account...' : 'Continue to Security Questions'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center text-xs">
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

      {/* STEP 2: Answer Security Questions */}
      {step === 2 && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#172554] tracking-tight">
                Security Verification
              </h2>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] hover:underline"
              >
                Change Account
              </button>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Answer all 3 security questions selected during your registration.
            </p>
          </div>

          <div className="mb-4 p-2.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172554] flex items-center justify-between">
            <span className="font-medium text-[#64748B]">Recovering for:</span>
            <span className="font-bold text-[#172554]">{identifier}</span>
          </div>

          <form onSubmit={handleVerifyAnswers} className="space-y-3.5" autoComplete="off">
            {questions.map((qText, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#172554] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-[#172554] leading-snug">
                    {qText}
                  </p>
                </div>

                <Input
                  label="Your Answer"
                  id={`answer_${idx}`}
                  type="password"
                  showPasswordToggle
                  placeholder="Enter your confidential answer"
                  value={answers[idx]}
                  onChange={(e) => {
                    const nextAnswers = [...answers];
                    nextAnswers[idx] = e.target.value;
                    setAnswers(nextAnswers);
                    if (fieldErrors[`answer_${idx}`]) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        [`answer_${idx}`]: '',
                      }));
                    }
                  }}
                  error={fieldErrors[`answer_${idx}`]}
                  helperText="Answers are case-insensitive"
                  required
                  autoComplete="off"
                />
              </div>
            ))}

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={loading}
              icon={ShieldCheck}
            >
              {loading ? 'Verifying Answers...' : 'Verify Answers & Continue'}
            </Button>
          </form>
        </>
      )}

      {/* STEP 3: Set New Password */}
      {step === 3 && (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Identity verified! Enter and confirm your new secure password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-3.5" autoComplete="off">
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
              helperText="Minimum 6 characters"
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
              {loading ? 'Updating Password...' : 'Reset Password'}
            </Button>
          </form>
        </>
      )}

      {/* STEP 4: Success Confirmation */}
      {step === 4 && (
        <div className="space-y-4 text-center py-3">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#0D9488] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-[#0D9488]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#172554] tracking-tight">
              Password Reset Complete!
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-sm mx-auto">
              Your password has been securely updated. The temporary reset token has been invalidated. You can now sign in with your new credentials.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate('/student/login', { replace: true })}
            >
              Sign In with New Password
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
