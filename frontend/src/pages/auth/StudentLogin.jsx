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
        <div className="w-10 h-10 rounded-xl bg-[#F1E7D9] border border-[#E8DED2] text-[#76543D] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#44352D]">Active Officer Session</h2>
          <p className="text-xs text-[#82776C] mt-1 leading-relaxed">
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
          Student Login
        </h2>
        <p className="text-xs text-[#82776C] mt-0.5">
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
            className="text-xs font-semibold text-[#76543D] hover:text-[#44352D] transition-colors"
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
      <div className="mt-5 pt-4 border-t border-[#E8DED2] text-center text-xs">
        <p className="text-[#82776C]">
          Don't have an account?{' '}
          <Link
            to="/student/register"
            className="font-bold text-[#44352D] hover:text-[#76543D] hover:underline"
          >
            Create a Student Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
