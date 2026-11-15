import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  LogIn,
  GraduationCap,
  ArrowLeft,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, studentLogin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated as student, redirect to student dashboard
  useEffect(() => {
    if (user && user.role === 'student') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'College email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      errors.email = 'Please enter a valid college email format';
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
      await studentLogin({
        email: email.trim(),
        password,
      });

      setSuccess('Authentication successful! Directing to student dashboard...');

      const destination = location.state?.from?.pathname || '/student/dashboard';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your college email and password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // If currently authenticated as an officer, prompt to switch
  if (user && user.role === 'officer') {
    return (
      <div className="space-y-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#172554]">Active Officer Session</h2>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            You are currently signed in as <strong>{user.name}</strong> (Placement Officer). To access a student account, please sign out first.
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
            Sign Out of Officer Session
          </Button>
          <Link to="/officer/dashboard">
            <Button variant="outline" className="w-full">
              Return to Officer Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2.5 pb-4 mb-4 border-b border-[#DBEAFE]">
        <div className="w-8 h-8 rounded-lg bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-[#172554] text-base leading-tight tracking-tight">
            CampusPlacement
          </span>
          <span className="text-[10px] text-[#64748B] font-semibold leading-tight">
            Recruitment Management Portal
          </span>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex p-1 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl mb-5">
        <div className="flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 bg-[#2563EB] text-white shadow-sm cursor-default">
          <GraduationCap className="w-4 h-4" />
          <span>Student Login</span>
        </div>
        <Link
          to="/officer/login"
          className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-[#64748B] hover:text-[#172554] hover:bg-white/70"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Placement Officer</span>
        </Link>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#172554] tracking-tight">
          Student Login
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Enter your college email and password to access your placement portal
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
          label="College Email"
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
          icon={LogIn}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      {/* Footer action */}
      <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center text-xs space-y-2">
        <p className="text-[#64748B]">
          Don't have an account?{' '}
          <Link
            to="/student/register"
            className="font-bold text-[#2563EB] hover:text-[#163A5F] hover:underline"
          >
            Create a Student Account
          </Link>
        </p>
        <p className="text-[11px] text-[#64748B]">
          Are you a placement officer?{' '}
          <Link
            to="/officer/login"
            className="font-semibold text-[#163A5F] hover:text-[#2563EB] hover:underline"
          >
            Go to Officer Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
