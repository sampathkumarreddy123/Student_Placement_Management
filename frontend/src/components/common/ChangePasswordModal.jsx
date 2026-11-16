import React, { useState, useEffect } from 'react';
import { Lock, X, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import Alert from './Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { PREDEFINED_SECURITY_QUESTIONS } from '../../constants/securityQuestions';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security Questions state
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [hasQuestions, setHasQuestions] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);

  // For users who haven't set up questions yet (e.g. officer provisioned by admin)
  const [setupQuestions, setSetupQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load user's security questions status whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const res = await authService.getMySecurityQuestions();
        if (isMounted && res.success) {
          setHasQuestions(res.hasSecurityQuestions);
          if (res.hasSecurityQuestions && Array.isArray(res.questions) && res.questions.length === 3) {
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
        console.error('Failed to load security questions status:', err);
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

    // Validate security questions
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
          'Failed to change password. Please verify your security answers.'
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
                Security Questions Verification ({user?.role === 'officer' ? 'Placement Officer' : 'Student'})
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

            {/* Section 1: Security Verification Questions */}
            <div className="p-3.5 bg-[#EFF6FF]/70 border border-[#DBEAFE] rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <h4 className="text-xs font-bold text-[#172554]">
                  {hasQuestions ? 'Answer Your Security Questions' : 'Setup Your Security Questions'}
                </h4>
              </div>
              <p className="text-[11px] text-[#64748B] leading-snug">
                {hasQuestions
                  ? 'Verify your identity by entering the correct answers to your 3 registered security questions below.'
                  : 'Select and answer 3 security questions. Once set, you will answer these questions whenever you change your password.'}
              </p>

              {loadingQuestions ? (
                <div className="py-4 text-center text-xs text-[#64748B]">
                  Loading security questions...
                </div>
              ) : hasQuestions ? (
                /* Existing Questions: Display and prompt for answers */
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
                /* Setup Questions: Select and Answer */
                <div className="space-y-3 pt-1">
                  {setupQuestions.map((sq, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-[#DBEAFE] space-y-2 shadow-2xs"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-[#172554] mb-1">
                          Question {idx + 1} <span className="text-[#DC2626]">*</span>
                        </label>
                        <select
                          value={sq.question}
                          onChange={(e) =>
                            handleSetupQuestionChange(idx, 'question', e.target.value)
                          }
                          className="block w-full rounded-lg border border-[#DBEAFE] text-xs py-2 px-2.5 bg-white text-[#172554] focus:outline-none focus:border-[#2563EB]"
                        >
                          <option value="">-- Choose Security Question {idx + 1} --</option>
                          {PREDEFINED_SECURITY_QUESTIONS.map((q) => {
                            const taken = isQuestionTaken(q, idx);
                            return (
                              <option key={q} value={q} disabled={taken}>
                                {q} {taken ? '(Already selected)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        {fieldErrors[`setup_q_${idx}`] && (
                          <p className="text-[11px] text-[#DC2626] font-medium mt-1">
                            {fieldErrors[`setup_q_${idx}`]}
                          </p>
                        )}
                      </div>

                      <Input
                        label="Answer"
                        id={`setup_a_${idx}`}
                        type="password"
                        showPasswordToggle
                        placeholder="Confidential answer"
                        value={sq.answer}
                        onChange={(e) =>
                          handleSetupQuestionChange(idx, 'answer', e.target.value)
                        }
                        error={fieldErrors[`setup_a_${idx}`]}
                        helperText="Answers are case-insensitive and hashed"
                        required
                        autoComplete="off"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: New Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="New Password"
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
                    setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                  }
                }}
                error={fieldErrors.newPassword}
                helperText={user?.role === 'officer' ? 'Minimum 8 characters' : 'Minimum 6 characters'}
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
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                error={fieldErrors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DBEAFE]/80">
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
                icon={KeyRound}
                className="bg-[#172554] hover:bg-[#0f172a] text-white shadow-xs cursor-pointer"
              >
                {loading
                  ? 'Verifying Answers...'
                  : hasQuestions
                  ? 'Verify Answers & Change Password'
                  : 'Save Questions & Change Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
