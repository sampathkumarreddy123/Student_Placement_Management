import React, { useState, useEffect } from 'react';
import { Lock, X, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import Alert from './Alert';
import LoadingSpinner from './LoadingSpinner';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { PREDEFINED_SECURITY_QUESTIONS } from '../../constants/securityQuestions';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security Questions State
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [hasQuestions, setHasQuestions] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);

  // For users who registered before security questions were introduced
  const [setupQuestions, setSetupQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch logged-in user's configured security questions on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);
        setError('');
        const res = await authService.getMySecurityQuestions();
        if (isMounted && res.success) {
          const configured = Boolean(
            res.hasSecurityQuestions &&
            Array.isArray(res.questions) &&
            res.questions.length === 3
          );
          setHasQuestions(configured);
          if (configured) {
            setExistingQuestions(res.questions);
            setAnswers(['', '', '']);
          } else {
            setSetupQuestions([
              { question: '', answer: '' },
              { question: '', answer: '' },
              { question: '', answer: '' },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load user security questions:', err);
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isQuestionTaken = (q, currentIndex) => {
    return setupQuestions.some(
      (item, idx) => idx !== currentIndex && item.question === q
    );
  };

  const handleSetupQuestionChange = (index, field, value) => {
    setSetupQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (fieldErrors[`setup_q_${index}`] || fieldErrors[`setup_a_${index}`]) {
      setFieldErrors((prev) => ({
        ...prev,
        [`setup_q_${index}`]: '',
        [`setup_a_${index}`]: '',
      }));
    }
  };

  const validate = () => {
    const errs = {};
    const minLength = user?.role === 'officer' ? 8 : 6;

    // Validate Security Question Answers
    if (hasQuestions) {
      answers.forEach((ans, idx) => {
        if (!ans.trim()) {
          errs[`answer_${idx}`] = `Please provide an answer for Question #${idx + 1}`;
        } else if (ans.trim().length < 2) {
          errs[`answer_${idx}`] = 'Answer must be at least 2 characters';
        }
      });
    } else {
      const chosen = new Set();
      setupQuestions.forEach((sq, idx) => {
        if (!sq.question) {
          errs[`setup_q_${idx}`] = `Please select Question #${idx + 1}`;
        } else if (chosen.has(sq.question)) {
          errs[`setup_q_${idx}`] = 'Each question must be unique';
        } else {
          chosen.add(sq.question);
        }

        if (!sq.answer.trim()) {
          errs[`setup_a_${idx}`] = 'Answer is required';
        } else if (sq.answer.trim().length < 2) {
          errs[`setup_a_${idx}`] = 'Answer must be at least 2 characters';
        }
      });
    }

    // Validate New Passwords
    if (!newPassword) {
      errs.newPassword = 'Enter your new password';
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
        newPassword,
        confirmPassword,
      };

      if (hasQuestions) {
        payload.securityAnswers = existingQuestions.map((q, idx) => ({
          question: q,
          answer: answers[idx].trim(),
        }));
      } else {
        payload.securityQuestions = setupQuestions.map((sq) => ({
          question: sq.question.trim(),
          answer: sq.answer.trim(),
        }));
      }

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
          'Verification failed. Please verify your security answers and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setAnswers(['', '', '']);
    setFieldErrors({});
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163A5F]/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#DBEAFE] w-full max-w-lg p-6 z-10 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DBEAFE]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#172554] shadow-xs">
              <KeyRound className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Change Password</h3>
              <p className="text-[11px] text-[#64748B]">
                {hasQuestions
                  ? 'Verify your identity by answering your security questions'
                  : 'Set up your security questions and update your password'}
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
              Your security answers were verified and your password has been securely updated.
            </p>
          </div>
        ) : loadingQuestions ? (
          <div className="py-12">
            <LoadingSpinner text="Retrieving security questions..." />
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

            {/* SECTION 1: SECURITY QUESTIONS VERIFICATION */}
            <div className="p-3.5 bg-[#EFF6FF]/70 border border-[#DBEAFE] rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <h4 className="text-xs font-bold text-[#172554]">
                  {hasQuestions ? 'Answer Your Security Questions' : 'Setup Your Security Questions'}
                </h4>
              </div>

              <p className="text-[11px] text-[#64748B] leading-snug">
                {hasQuestions
                  ? 'Answer the 3 security questions associated with your registered account.'
                  : 'Since you registered before security questions were introduced, please choose 3 questions and answers once to protect your account.'}
              </p>

              {hasQuestions ? (
                /* SAME 3 Questions: Render read-only question titles + answer inputs */
                <div className="space-y-3 pt-1">
                  {existingQuestions.map((qText, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-[#DBEAFE] space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#172554] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-[#172554] leading-snug">
                          {qText}
                        </p>
                      </div>

                      <Input
                        label=""
                        id={`answer_${idx}`}
                        type="password"
                        showPasswordToggle
                        placeholder="Enter your confidential answer"
                        value={answers[idx]}
                        onChange={(e) => {
                          const next = [...answers];
                          next[idx] = e.target.value;
                          setAnswers(next);
                          if (fieldErrors[`answer_${idx}`]) {
                            setFieldErrors((prev) => ({ ...prev, [`answer_${idx}`]: '' }));
                          }
                        }}
                        error={fieldErrors[`answer_${idx}`]}
                        helperText="Case-insensitive"
                        required
                        autoComplete="off"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Only for legacy accounts that haven't set questions yet */
                <div className="space-y-3 pt-1">
                  {setupQuestions.map((sq, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-[#DBEAFE] space-y-2 shadow-2xs"
                    >
                      <label className="block text-xs font-semibold text-[#172554]">
                        Security Question #{idx + 1} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={sq.question}
                        onChange={(e) =>
                          handleSetupQuestionChange(idx, 'question', e.target.value)
                        }
                        className="w-full text-xs rounded-lg border border-[#DBEAFE] py-2 px-3 focus:outline-none focus:border-[#2563EB] bg-white text-[#172554]"
                      >
                        <option value="">-- Choose Question #{idx + 1} --</option>
                        {PREDEFINED_SECURITY_QUESTIONS.map((q) => {
                          const taken = isQuestionTaken(q, idx);
                          return (
                            <option key={q} value={q} disabled={taken}>
                              {q} {taken ? '(Chosen)' : ''}
                            </option>
                          );
                        })}
                      </select>

                      <Input
                        label=""
                        type="password"
                        showPasswordToggle
                        placeholder={`Enter answer for question #${idx + 1}`}
                        value={sq.answer}
                        onChange={(e) =>
                          handleSetupQuestionChange(idx, 'answer', e.target.value)
                        }
                        error={fieldErrors[`setup_a_${idx}`]}
                        helperText="Answers are case-insensitive and securely hashed"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: NEW PASSWORD */}
            <div className="space-y-3 pt-1">
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
            </div>

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
                {loading ? 'Verifying Answers...' : 'Verify Answers & Change Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
