import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  GraduationCap,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';

const OfficerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, officerLogin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated as officer, redirect immediately to officer dashboard
  useEffect(() => {
    if (user && user.role === 'officer') {
      navigate('/officer/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Official institutional email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      errors.email = 'Please provide a valid institutional email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      await officerLogin({
        email: email.trim(),
        password,
      });

      setSuccess('Officer credentials verified. Directing to Placement Officer Dashboard...');

      const destination = location.state?.from?.pathname || '/officer/dashboard';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your officer credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // If currently authenticated as student, prompt to sign out first
  if (user && user.role === 'student') {
    return (
      <div className="space-y-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#172554]">Active Student Session</h2>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            You are currently signed in as <strong>{user.name}</strong> (Student). To access the Placement Officer portal, please sign out first.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            variant="primary"
            icon={LogOut}
            className="w-full"
            onClick={async () => {
              await logout();
              setError('');
            }}
          >
            Sign Out of Student Session
          </Button>
          <Link to="/student/dashboard">
            <Button variant="outline" className="w-full">
              Return to Student Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header: Logo & Back to Home */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DBEAFE]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#172554] text-sm tracking-tight">
            CampusPlacement
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-[#64748B] hover:text-[#172554] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#172554] tracking-tight">
          Placement Officer Login
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Sign in with your official institutional email to access administrative controls
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

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <Input
          label="Official Email"
          id="email"
          name="email"
          type="email"
          placeholder=""
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
          }}
          error={fieldErrors.email}
          required
          autoComplete="off"
        />

        <Input
          label="Password"
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
          required
          autoComplete="new-password"
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={loading}
          icon={ShieldCheck}
        >
          {loading ? 'Verifying...' : 'Sign In'}
        </Button>
      </form>

      {/* Back to Home bottom link */}
      <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center text-xs">
        <Link
          to="/"
          className="font-semibold text-[#64748B] hover:text-[#172554] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OfficerLogin;
