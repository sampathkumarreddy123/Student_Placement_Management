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
    rollNumber: '',
    department: '',
    graduationYear: '',
    password: '',
    confirmPassword: '',
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        rollNumber: formData.rollNumber.trim(),
        department: formData.department,
        graduationYear: Number(formData.graduationYear),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
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
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8DED2]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#44352D] flex items-center justify-center text-[#F1E7D9] shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#44352D] text-sm tracking-tight">
            CampusPlacement
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-[#82776C] hover:text-[#44352D] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#44352D] tracking-tight">
          Student Registration
        </h2>
        <p className="text-xs text-[#82776C] mt-0.5">
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
              className="block text-xs font-semibold text-[#44352D] mb-1.5"
            >
              Department <span className="text-[#C94C4C]">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`block w-full rounded-lg border text-xs py-2 px-3 focus:outline-none focus:border-[#76543D] focus:ring-1 focus:ring-[#F1E7D9] bg-white text-[#44352D] ${
                fieldErrors.department ? 'border-[#C94C4C]' : 'border-[#E8DED2]'
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
              <p className="mt-1 text-xs text-[#C94C4C] font-medium">{fieldErrors.department}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="graduationYear"
              className="block text-xs font-semibold text-[#44352D] mb-1.5"
            >
              Graduation Year <span className="text-[#C94C4C]">*</span>
            </label>
            <select
              id="graduationYear"
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleChange}
              className={`block w-full rounded-lg border text-xs py-2 px-3 focus:outline-none focus:border-[#76543D] focus:ring-1 focus:ring-[#F1E7D9] bg-white text-[#44352D] ${
                fieldErrors.graduationYear ? 'border-[#C94C4C]' : 'border-[#E8DED2]'
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
              <p className="mt-1 text-xs text-[#C94C4C] font-medium">{fieldErrors.graduationYear}</p>
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
      <div className="mt-5 pt-4 border-t border-[#E8DED2] text-center text-xs">
        <p className="text-[#82776C]">
          Already have an account?{' '}
          <Link
            to="/student/login"
            className="font-bold text-[#44352D] hover:text-[#76543D] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
