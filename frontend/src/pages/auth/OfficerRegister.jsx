import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';

const OfficerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    setupToken: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Official institutional email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid institutional email format';
    }

    if (!formData.setupToken.trim()) {
      errors.setupToken = 'Institutional Security Setup Key is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      const res = await authService.registerOfficer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        setupToken: formData.setupToken.trim(),
      });

      setSuccess('Officer account created successfully! Redirecting to Officer Login...');
      setTimeout(() => {
        navigate('/officer/login', { replace: true });
      }, 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to create officer account. Please check your setup key.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
            Institutional Administration
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Placement Officer Registration
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Authorized campus placement staff, coordinators, and administrators
        </p>
      </div>

      {/* Security notice banner */}
      <div className="p-3 mb-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-2.5">
        <KeyRound className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Protected Administrator Portal</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            Officer registration requires the <strong>Institutional Setup Key</strong> configured in your server environment to prevent unauthorized student registrations.
          </p>
        </div>
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
        <Input
          label="Officer Full Name"
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

        <Input
          label="Official Institutional Email"
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
          label="Institutional Security Setup Key"
          id="setupToken"
          name="setupToken"
          type="password"
          placeholder=""
          icon={KeyRound}
          showPasswordToggle
          value={formData.setupToken}
          onChange={handleChange}
          error={fieldErrors.setupToken}
          helperText="Enter the server setup token (e.g. OFFICER_SETUP_TOKEN from .env)"
          required
          autoComplete="off"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password (min 8 characters)"
            id="password"
            name="password"
            type="password"
            placeholder=""
            icon={Lock}
            showPasswordToggle
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
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
          className="w-full mt-4"
          isLoading={loading}
          icon={ShieldCheck}
        >
          {loading ? 'Creating Officer Account...' : 'Register Officer Account'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs">
        <p className="text-slate-600">
          Already have an officer account?{' '}
          <Link
            to="/officer/login"
            className="font-semibold text-slate-900 hover:underline"
          >
            Officer Sign In
          </Link>
        </p>

        <p className="text-slate-500 pt-1">
          Are you a student?{' '}
          <Link
            to="/student/login"
            className="font-semibold text-slate-900 hover:underline inline-flex items-center gap-1"
          >
            Student Login <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OfficerRegister;

