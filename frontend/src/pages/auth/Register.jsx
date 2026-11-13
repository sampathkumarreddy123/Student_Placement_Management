import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Hash,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';

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
    password: '',
    confirmPassword: '',
    rollNumber: '',
    department: 'Computer Science',
    graduationYear: 2026,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        rollNumber: formData.rollNumber.trim(),
        department: formData.department,
        graduationYear: Number(formData.graduationYear),
      };

      const data = await register(payload);
      setSuccess('Account created successfully! Redirecting to student dashboard...');

      setTimeout(() => {
        navigate('/student/dashboard', { replace: true });
      }, 700);
    } catch (err) {
      setError(
        err.message || 'Registration failed. Please review your inputs and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Student Registration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Create your verified placement profile to apply for campus hiring drives
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

      {/* Notice about Officer Registration */}
      <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-[11px] text-slate-600">
        <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p>
          Placement Officer accounts are protected and provisioned by the university administration.
          Officers should <Link to="/login" className="text-blue-600 font-medium underline">sign in here</Link>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Legal Name"
          id="name"
          name="name"
          placeholder="e.g. Rahul Verma"
          icon={User}
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="College Email"
            id="email"
            name="email"
            type="email"
            placeholder="rollno@college.edu"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            required
          />

          <Input
            label="Roll Number / Student ID"
            id="rollNumber"
            name="rollNumber"
            placeholder="CS2026-042"
            icon={Hash}
            value={formData.rollNumber}
            onChange={handleChange}
            error={fieldErrors.rollNumber}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="department"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Academic Department <span className="text-rose-500">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {fieldErrors.department && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.department}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="graduationYear"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Graduation Year <span className="text-rose-500">*</span>
            </label>
            <select
              id="graduationYear"
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {GRADUATION_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  Class of {yr}
                </option>
              ))}
            </select>
            {fieldErrors.graduationYear && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.graduationYear}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password (min 6 characters)"
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            showPasswordToggle
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            required
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            showPasswordToggle
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-4"
          isLoading={loading}
          icon={ArrowRight}
        >
          {loading ? 'Creating Student Profile...' : 'Complete Student Registration'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
