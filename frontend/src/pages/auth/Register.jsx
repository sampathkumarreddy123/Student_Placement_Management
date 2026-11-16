import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Hash,
  GraduationCap,
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { PREDEFINED_SECURITY_QUESTIONS } from '../../constants/securityQuestions';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    graduationYear: '',
    password: '',
    confirmPassword: '',
  });

  const [securityQuestions, setSecurityQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [securityErrors, setSecurityErrors] = useState(['', '', '']);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const isQuestionTaken = (q, currentIndex) => {
    return securityQuestions.some(
      (item, idx) => idx !== currentIndex && item.question === q
    );
  };

  const handleSecurityQuestionChange = (index, field, value) => {
    setSecurityQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    setSecurityErrors((prev) => {
      const updated = [...prev];
      updated[index] = '';
      return updated;
    });

    if (fieldErrors.securityQuestions) {
      setFieldErrors((prev) => ({ ...prev, securityQuestions: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'College email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email format';
    }

    if (!formData.rollNumber.trim()) {
      errors.rollNumber = 'Roll number / Student ID is required';
    }

    if (!formData.department) {
      errors.department = 'Please select your department';
    }

    if (!formData.graduationYear) {
      errors.graduationYear = 'Graduation year is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate 3 security questions
    let hasSecurityError = false;
    const newSecurityErrors = ['', '', ''];
    const chosenQuestions = new Set();

    for (let i = 0; i < securityQuestions.length; i++) {
      const q = securityQuestions[i].question;
      const a = securityQuestions[i].answer.trim();

      if (!q) {
        newSecurityErrors[i] = 'Please select a question';
        hasSecurityError = true;
      } else if (chosenQuestions.has(q)) {
        newSecurityErrors[i] = 'Duplicate question selected';
        hasSecurityError = true;
      } else {
        chosenQuestions.add(q);
      }

      if (!a) {
        newSecurityErrors[i] = newSecurityErrors[i]
          ? `${newSecurityErrors[i]} and provide an answer`
          : 'Please provide an answer';
        hasSecurityError = true;
      } else if (a.length < 2) {
        newSecurityErrors[i] = 'Answer must be at least 2 characters';
        hasSecurityError = true;
      }
    }

    setSecurityErrors(newSecurityErrors);
    if (hasSecurityError) {
      errors.securityQuestions = 'Please complete all 3 security questions and answers';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        rollNumber: formData.rollNumber.trim(),
        department: formData.department,
        graduationYear: Number(formData.graduationYear),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        securityQuestions: securityQuestions.map((sq) => ({
          question: sq.question.trim(),
          answer: sq.answer.trim(),
        })),
      });

      setSuccess('Account created successfully! Directing to student dashboard...');
      setTimeout(() => {
        navigate('/student/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your details and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header: Logo & Back to Home */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DBEAFE]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-4 h-4" />
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
          Back to Sign In
        </Link>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#172554] tracking-tight">
          Student Registration
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Create your student account to apply for recruitment drives
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

      {success && (
        <Alert
          type="success"
          message={success}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
        {/* Full Name */}
        <Input
          label="Full Name"
          id="name"
          name="name"
          placeholder=""
          icon={User}
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          required
          autoComplete="off"
        />

        {/* College Email & Roll Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="College Email"
            id="email"
            name="email"
            type="email"
            placeholder=""
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            required
            autoComplete="off"
          />

          <Input
            label="Roll Number / Student ID"
            id="rollNumber"
            name="rollNumber"
            placeholder=""
            icon={Hash}
            value={formData.rollNumber}
            onChange={handleChange}
            error={fieldErrors.rollNumber}
            required
            autoComplete="off"
          />
        </div>

        {/* Department & Graduation Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="department"
              className="block text-xs font-semibold text-[#172554] mb-1.5"
            >
              Department <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`block w-full rounded-lg border text-xs py-2 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#DBEAFE] bg-white text-[#172554] ${
                fieldErrors.department ? 'border-[#DC2626]' : 'border-[#DBEAFE]'
              }`}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {fieldErrors.department && (
              <p className="mt-1 text-xs text-[#DC2626] font-medium">{fieldErrors.department}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="graduationYear"
              className="block text-xs font-semibold text-[#172554] mb-1.5"
            >
              Graduation Year <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="graduationYear"
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleChange}
              className={`block w-full rounded-lg border text-xs py-2 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#DBEAFE] bg-white text-[#172554] ${
                fieldErrors.graduationYear ? 'border-[#DC2626]' : 'border-[#DBEAFE]'
              }`}
            >
              <option value="">Select Year</option>
              {GRADUATION_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  Class of {yr}
                </option>
              ))}
            </select>
            {fieldErrors.graduationYear && (
              <p className="mt-1 text-xs text-[#DC2626] font-medium">{fieldErrors.graduationYear}</p>
            )}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder=""
            icon={Lock}
            showPasswordToggle
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            helperText="Minimum 6 characters"
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder=""
            icon={Lock}
            showPasswordToggle
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            required
            autoComplete="new-password"
          />
        </div>

        {/* Security Questions Section */}
        <div className="pt-2">
          <div className="p-3.5 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF]/60 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#163A5F] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-[#172554]">
                    Security Questions (Mandatory)
                  </h3>
                  <span className="text-[10px] font-semibold bg-[#2563EB] text-white px-1.5 py-0.2 rounded">
                    3 Required
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                  Choose 3 distinct questions. These answers are required for account recovery if you ever forget your password. Answers are securely hashed and never shared.
                </p>
              </div>
            </div>

            {fieldErrors.securityQuestions && (
              <p className="text-xs text-[#DC2626] font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                {fieldErrors.securityQuestions}
              </p>
            )}

            <div className="space-y-3 pt-1">
              {securityQuestions.map((sq, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#DBEAFE] bg-white space-y-2 shadow-xs"
                >
                  <div>
                    <label
                      htmlFor={`security-question-${idx}`}
                      className="block text-xs font-semibold text-[#172554] mb-1"
                    >
                      Question {idx + 1} <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      id={`security-question-${idx}`}
                      value={sq.question}
                      onChange={(e) =>
                        handleSecurityQuestionChange(idx, 'question', e.target.value)
                      }
                      className={`block w-full rounded-lg border text-xs py-2 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#DBEAFE] bg-white text-[#172554] ${
                        securityErrors[idx] && !sq.question
                          ? 'border-[#DC2626]'
                          : 'border-[#DBEAFE]'
                      }`}
                    >
                      <option value="">-- Choose Security Question {idx + 1} --</option>
                      {PREDEFINED_SECURITY_QUESTIONS.map((q) => {
                        const taken = isQuestionTaken(q, idx);
                        return (
                          <option key={q} value={q} disabled={taken}>
                            {q} {taken ? '(Selected in another question)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <Input
                      label={`Answer ${idx + 1}`}
                      id={`security-answer-${idx}`}
                      type="password"
                      showPasswordToggle
                      placeholder="Enter your confidential answer"
                      value={sq.answer}
                      onChange={(e) =>
                        handleSecurityQuestionChange(idx, 'answer', e.target.value)
                      }
                      error={securityErrors[idx]}
                      helperText="Answers are case-insensitive and trimmed"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-3"
          isLoading={loading}
          icon={UserPlus}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      {/* Footer link */}
      <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center text-xs">
        <p className="text-[#64748B]">
          Already have an account?{' '}
          <Link
            to="/student/login"
            className="font-bold text-[#2563EB] hover:text-[#163A5F] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
