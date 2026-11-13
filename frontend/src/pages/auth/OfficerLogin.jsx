import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';

const OfficerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
      const data = await officerLogin({
        email: email.trim(),
        password,
        rememberMe,
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
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Student Session Detected</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            You are currently signed in as <strong>{user.name}</strong> (Student). To access the Placement Officer portal, please sign out of your student session first.
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
      {/* Top Heading */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Placement Cell Administration
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Placement Officer Sign In
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Authorized campus placement staff, directors, and recruiters only
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
          label="Official Institutional Email"
          id="officer-email"
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
          id="officer-password"
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

        {/* Remember Session checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-600">
              Remember session for 30 days
            </span>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={loading}
          icon={ShieldCheck}
        >
          {loading ? 'Verifying Credentials...' : 'Sign In as Officer'}
        </Button>
      </form>

      {/* Register or Switch to Student Portal */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs">
        <p className="text-slate-600">
          Need to set up an officer account?{' '}
          <Link
            to="/officer/register"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Register Officer Account
          </Link>
        </p>

        <p className="text-slate-500 pt-1">
          Looking for student recruitment drives?{' '}
          <Link
            to="/student/login"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            Go to Student Login <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OfficerLogin;

