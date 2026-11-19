import React, { useState, useEffect } from 'react';
import { Lock, X, CheckCircle2, ShieldCheck, KeyRound, HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Input from './Input';
import Button from './Button';
import Alert from './Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { PREDEFINED_SECURITY_QUESTIONS } from '../../constants/securityQuestions';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  // Mode: 'standard' (current password) or 'security_questions' (fallback if current password forgotten)
  const [mode, setMode] = useState('standard');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security Questions fallback state
  const [hasQuestions, setHasQuestions] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);

  // First-time setup questions (optional for users registered before the feature)
  const [setupQuestions, setSetupQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check user's security questions status
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        const res = await authService.getMySecurityQuestions();
        if (isMounted && res.success) {
          setHasQuestions(Boolean(res.hasSecurityQuestions));
          if (res.hasSecurityQuestions && Array.isArray(res.questions) && res.questions.length === 3) {
            setExistingQuestions(res.questions);
          }
        }
      } catch (err) {
        console.error('Failed to load security questions status:', err);
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

    if (mode === 'standard') {
      if (!currentPassword) {
        errs.currentPassword = 'Enter your current password';
      }
    } else if (mode === 'security_questions') {
      if (hasQuestions) {
        answers.forEach((ans, idx) => {
          if (!ans.trim()) {
            errs[`answer_${idx}`] = `Answer is required for Question #${idx + 1}`;
          }
        });
      } else {
        const chosen = new Set();
        setupQuestions.forEach((sq, idx) => {
          if (!sq.question) {
            errs[`setup_q_${idx}`] = 'Please select a question';
          } else if (chosen.has(sq.question)) {
            errs[`setup_q_${idx}`] = 'Duplicate question selected';
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
        newPassword,
        confirmPassword,
      };

      if (mode === 'standard') {
        payload.currentPassword = currentPassword;
      } else if (mode === 'security_questions') {
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
          'Failed to change password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAnswers(['', '', '']);
    setFieldErrors({});
    setError('');
    setSuccess(false);
    setMode('standard');
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
              <h3 className="text-sm font-bold text-[#172554]">Change Account Password</h3>
              <p className="text-[11px] text-[#64748B]">
                {mode === 'standard' ? 'Update your confidential login password' : 'Verify identity via Security Questions'}
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
              Your account password has been securely updated. You can now use your new password.
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

            {/* Standard Mode: Current Password */}
            {mode === 'standard' ? (
              <div className="space-y-3">
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('security_questions');
                      setError('');
                      setFieldErrors({});
                    }}
                    className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] hover:underline"
                  >
                    Forgot current password? Verify with security questions
                  </button>
                </div>
              </div>
            ) : (
              /* Security Questions Fallback Mode */
              <div className="p-3.5 bg-[#EFF6FF]/70 border border-[#DBEAFE] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-xs font-bold text-[#172554]">
                      {hasQuestions ? 'Answer Security Questions' : 'Setup Security Questions'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('standard');
                      setError('');
                      setFieldErrors({});
                    }}
                    className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Current Password
                  </button>
                </div>

                <p className="text-[11px] text-[#64748B] leading-snug">
                  {hasQuestions
                    ? 'Verify your identity by answering the security questions configured on your account.'
                    : 'Configure 3 security recovery questions to verify your identity and change your password.'}
                </p>

                {hasQuestions ? (
                  /* Existing Questions */
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
                  /* Initial Setup (for legacy users) */
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
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Password & Confirm Password */}
            <div className="space-y-3 pt-2">
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
